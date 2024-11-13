import { action, createAsync, RouteDefinition, RouteSectionProps, query, useSearchParams, useNavigate, } from "@solidjs/router";
import { For, Show, } from "solid-js";
import { createStore } from "solid-js/store";
import Alert from "~/components/alert";
import { Button } from "~/components/buttons";
import { AppContext } from "~/components/context";
import { ChevronRightIcon, HandHeartIcon, PlusIcon, QRCodeIcon } from "~/components/icons";
import QRCodeScanner from "~/components/qrcode";
import { currencies, useFormatter } from "~/lib/intl";
import { completeSignUpWithNewFamily, getCurrentAccount, loginWithToken, signupWithToken, getInvite, completeSignUpWithInvite } from "~/lib/server";
import { store } from "~/lib/wstore";


const loadAccount = query(async () => {
  let [params, setParams] = useSearchParams()
  if (typeof params.login_token === "string") {
    await loginWithToken(params.login_token)
    setParams({ ...params, login_token: undefined }, { replace: true })
  } else if (typeof params.signup_token === "string") {
    await signupWithToken(params.signup_token)
    setParams({ ...params, signup_token: undefined }, { replace: true })
  }
  return await getCurrentAccount()
}, "user")

export const route = {
  preload() { loadAccount() }
} satisfies RouteDefinition;


export default function PrivateSection(props: RouteSectionProps) {
  let account = createAsync(() => loadAccount())
  return (
    <Show when={account()} keyed>
      {account => (
        <>
          <Show when={account.family} keyed>
            {family => (
              <AppContext.Provider value={{
                user: account.user,
                family: family,
                formatter: useFormatter(family.currency),
              }}>
                <store.Provider namespace={family.id.toString()} >
                  {props.children}
                </store.Provider>
              </AppContext.Provider>
            )}
          </Show>
          <Show when={!account.family}>
            <Welcome />
          </Show>
        </>
      )
      }
    </Show >
  )
}



function Welcome() {
  // TODO: this is missing a logoug button
  let navigate = useNavigate()
  let [params, setParams] = useSearchParams()
  let [state, setState] = createStore({
    nickname: "",
    invite: undefined as undefined | { familyName: string, code: string }
  })
  let options = [
    {
      title: "Create new family",
      icon: PlusIcon,
      onClick: () => {
        setParams({ type: "create" })
      }
    },
    {
      title: "Join existing family",
      icon: QRCodeIcon,
      description: "Scan an invite QR Code generated by another family member.",
      onClick: () => {
        setParams({ ...params, scanner: true, type: "join" })
      }
    },
  ]

  let signup = action(async (data: FormData) => {
    let name = data.get("name") as string
    if (params.type === "create") {
      let familyName = data.get("family") as string
      let currency = data.get("currency") as string
      return await completeSignUpWithNewFamily(name, familyName, currency)
    }
    if (params.type === "join") {
      let code = data.get("code") as string
      return await completeSignUpWithInvite(name, code)
    }
  })

  async function onScannerCancel() {
    navigate(-1)
  }

  async function onScannerResult(code: string) {
    setParams({ ...params, scanner: undefined, error: undefined }, { replace: true })
    try {
      let invite = await getInvite(code)
      setState(current => ({ ...current, invite: { ...invite, code: code } }))
    } catch (e: any) {
      setParams({ ...params, error: e?.toString() || "Something went wront" }, { replace: true })
    }
  }

  return (
    <main class="sm:px-6 py-24">
      <div class="relative mx-auto surface shadow-xl rounded-2xl px-6 sm:px-10 pb-12 pt-6 max-w-md">
        <div class="flex justify-center pb-10">
          <img class="h-20 w-20"
            alt="Logo"
            src="/logo.svg" />
        </div>
        <h1 class="text-2xl font-semibold pb-8">Welcome</h1>
        <form action={signup}
          method="post">
          <label for="name"
            class="block pb-2 text-light">Your Nickname</label>
          <input name="name"
            id="name"
            min="2"
            max="32"
            onChange={e => setState(current => ({ ...current, nickname: e.currentTarget.value.trim() }))}
            class="block border h-12 px-4 w-full rounded-lg"
            required />
          <Show when={state.nickname}>
            <Show when={params.type === undefined}>
              <div class="surface rounded mt-12">
                <For each={options}>
                  {(option, index) => (
                    <button
                      type="button"
                      class="w-full group flex gap-6 text-left text-lg px-6 py-6 hover:bg-gradient-to-r hover:to-white hover:via-slate-50 hover:from-primary-50"
                      classList={{
                        "border-t border-gray-200": index() > 0,
                      }}
                      onClick={option.onClick}
                    >
                      <option.icon class="text-primary w-6 h-6 text-light" />
                      <span class="block flex-grow">
                        <span class="block font-medium">{option.title}</span>
                        <span class="block text-light text-base">{option.description}</span>
                      </span>
                      <ChevronRightIcon class="w-6 h-6 text-gray-400" />
                    </button>
                  )}
                </For>
              </div>
            </Show>
            <Show when={params.type === "create"}>
              <div class="pt-6 space-y-8">
                <div>
                  <label for="family"
                    class="block pb-2 text-light">Your family's Nickname</label>
                  <input name="family"
                    id="family"
                    minlength="2"
                    maxlength="64"
                    class="block border h-12 px-4 w-full rounded-lg"
                    required />
                </div>
                <div>
                  <label for="currency"
                    class="block pb-2 text-light">Currency</label>
                  <select name="currency"
                    id="currency"
                    class="block border h-12 px-4 w-full rounded-lg"
                    required>
                    <For each={Object.entries(currencies)}>
                      {([code, name]) => (
                        <option value={code}
                          selected={code === "USD"}>
                          {`${code} - ${name}`}
                        </option>
                      )}
                    </For>
                  </select>
                </div>
              </div>
            </Show>
            <Show when={params.type === "join"}>
              <Show when={params.scanner}>
                <QRCodeScanner title="Scan QR Code"
                  description="Scan an invite QR Code generated by a family member."
                  onResult={code => onScannerResult(code)}
                  onCancel={onScannerCancel}
                />
              </Show>
              <Show when={state.invite}>
                {(invite) => (
                  <div class="pt-12">
                    <label for="code"
                      class="font-medium text-lg block pb-2">
                      Joining family
                    </label>
                    <input name="code"
                      type="hidden"
                      id="code"
                      value={invite().code}
                      required />
                    <div class="flex items-center flex-col gap-4 border border-gray-200 rounded-xl py-6 px-6">
                      <p class="bg-slate-200 uppercase inline-flex items-center justify-center rounded-full text-2xl text-primary w-16 h-16 p-2">
                        <HandHeartIcon class="flex-shrink-0 flex-shrink-0 w-10 h-10" />
                      </p>
                      <p class="text-2xl text-center font-medium">
                        {invite().familyName}
                      </p>
                      <p class="block -mt-3 text-light">
                        Family
                      </p>
                    </div>
                  </div>
                )}
              </Show>
            </Show>
          </Show>
          <Alert error={params.error as string}
            when={!!params.error}
            class="mt-8"
          />
          <div class="pt-12 space-y-4">
            <Button style="primary"
              label="Continue"
            />
            <Show when={!!params.type}>
              <Button style="neutral"
                label="Cancel"
                type="button"
                onClick={() => navigate(-1)}
              />
            </Show>
          </div>
        </form>
      </div>
    </main>
  )
}












