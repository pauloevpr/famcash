import { action, cache, createAsync, RouteDefinition, RouteSectionProps, useSearchParams } from "@solidjs/router";
import { clientOnly } from "@solidjs/start"
import { Show } from "solid-js";
import { Button } from "~/components/buttons";
import { AppContext } from "~/components/context";
import { finishSignup, getCurrentSession, loginWithToken, signupWithToken } from "~/lib/server";
import { createStore } from "~/lib/store";

const ClientSyncService = clientOnly(() => import("~/lib/sync"));

const loadSession = cache(async () => {
  let [params, setParams] = useSearchParams()
  if (params.login_token) {
    await loginWithToken(params.login_token)
    setParams({ ...params, login_token: undefined }, { replace: true })
  } else if (params.signup_token) {
    await signupWithToken(params.signup_token)
    setParams({ ...params, signup_token: undefined }, { replace: true })
  }
  return await getCurrentSession()
}, "user")

export const route = {
  preload() { loadSession() }
} satisfies RouteDefinition;


export default function PrivateSection(props: RouteSectionProps) {
  let session = createAsync(() => loadSession())
  return (
    <Show when={session()} >
      {session => (
        <>
          <Show when={session().family}>
            {family => (
              <AppContext.Provider value={{
                user: session().user,
                family: family(),
                store: createStore(session().user, family())
              }}>
                <ClientSyncService />
                {props.children}
              </AppContext.Provider>
            )}
          </Show>
          <Show when={!session().family}>
            <Welcome />
          </Show>
        </>
      )
      }
    </Show >
  )
}



function Welcome() {
  let finishSignupAction = action(async (data: FormData) => {
    let name = data.get("name") as string
    return await finishSignup(name)
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
        <form action={finishSignupAction}
          method="post">
          <label for="name"
            class="block pb-2 text-light">What is your name?</label>
          <input name="name"
            id="name"
            min="2"
            max="32"
            class="block border h-12 px-4 w-full rounded-lg mb-6"
            required />
          <Button style="primary"
            label="Continue"
          />
        </form>
      </div>
    </main>
  )
}
