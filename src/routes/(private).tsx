import { action, cache, createAsync, RouteDefinition, RouteSectionProps, useSearchParams, } from "@solidjs/router";
import { clientOnly } from "@solidjs/start"
import { createMemo, createSignal, For, onCleanup, Show, useContext } from "solid-js";
import { Button } from "~/components/buttons";
import { AppContext } from "~/components/context";
import { ChevronRightIcon, PlusIcon, QRCodeIcon } from "~/components/icons";
import { signupWithNewFamily, getCurrentAccount, loginWithToken, signupWithToken } from "~/lib/server";
import { createStore } from "~/lib/store";

const ClientSyncService = clientOnly(() => import("~/lib/sync"));

const loadAccount = cache(async () => {
  let [params, setParams] = useSearchParams()
  if (params.login_token) {
    await loginWithToken(params.login_token)
    setParams({ ...params, login_token: undefined }, { replace: true })
  } else if (params.signup_token) {
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
    <Show when={account()} >
      {account => (
        <>
          <Show when={account().family}>
            {family => (
              <AppContext.Provider value={{
                user: account().user,
                family: family(),
                store: createStore(account().user, family())
              }}>
                {props.children}
                <ClientSyncService />
                <LoadingScreenOverlay />
              </AppContext.Provider>
            )}
          </Show>
          <Show when={!account().family}>
            <Welcome />
          </Show>
        </>
      )
      }
    </Show >
  )
}


function LoadingScreenOverlay() {
  let { store } = useContext(AppContext)
  let [minimumDisplayTimeReached, setMinimumDisplayTimeReached] = createSignal(false)
  let done = createMemo(() => minimumDisplayTimeReached() && store.idb.ready)

  let timeout = setTimeout(() => {
    setMinimumDisplayTimeReached(true)
  }, 300)

  onCleanup(() => clearTimeout(timeout))

  return (
    <Show when={!done()}>
      <dialog class="bg-white z-[999] fixed top-0 left-0 flex items-center justify-center h-screen w-screen"
        open>
        Loading...
      </dialog>
    </Show>
  )
}

function Welcome() {
  let [type, setType] = createSignal("" as "create" | "join")
  let options = [
    {
      title: "Create new family",
      icon: PlusIcon,
      onClick: () => setType("create")
    },
    {
      title: "Join existing family",
      icon: QRCodeIcon,
      onClick: () => { }
    },
  ]

  let signup = action(async (data: FormData) => {
    if (type() !== "create") return
    let name = data.get("name") as string
    let familyName = data.get("family") as string
    return await signupWithNewFamily(name, familyName)
  })

  return (
    <main class="px-6 py-24">
      <div class="relative mx-auto bg-white shadow-xl rounded-2xl px-10 pb-12 pt-6 max-w-md">
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
            class="block border h-12 px-4 w-full rounded-lg"
            required />
          <Show when={!type()}>
            <div class="bg-white rounded-xl border border-gray-200 my-12">
              <For each={options}>
                {(option, index) => (
                  <button
                    type="button"
                    class="w-full group flex items-center gap-6 text-left text-lg px-6 h-16 hover:bg-gradient-to-r hover:to-white hover:via-slate-50 hover:from-primary-50"
                    classList={{
                      "border-t border-gray-200": index() > 0,
                    }}
                    onClick={option.onClick}
                  >
                    <option.icon class="text-primary w-6 h-6 text-light" />
                    <span class="block flex-grow">
                      <span class="block">{option.title}</span>
                    </span>
                    <ChevronRightIcon class="w-6 h-6 text-gray-400" />
                  </button>
                )}
              </For>
            </div>
          </Show>
          <Show when={type() === "create"}>
            <div class="pt-6 pb-12">
              <label for="family"
                class="block pb-2 text-light">Your family's Nickname</label>
              <input name="family"
                id="family"
                min="2"
                max="64"
                class="block border h-12 px-4 w-full rounded-lg"
                required />
            </div>
          </Show>
          <Button style="primary"
            label="Continue"
          />
        </form>
      </div>
    </main>
  )
}

