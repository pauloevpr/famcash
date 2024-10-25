import { cache, createAsync, RouteDefinition, RouteSectionProps, useNavigate, useSearchParams } from "@solidjs/router";
import { clientOnly } from "@solidjs/start"
import { Show } from "solid-js";
import { SignedInUserContext } from "~/components/context";
import { idb } from "~/lib/idb";
import { SignedInUser } from "~/lib/models";
import { getCurrentUser, loginWithToken, signupWithToken } from "~/lib/server";
import { triggerSync } from "~/lib/sync";

const ClientSyncService = clientOnly(() => import("~/lib/sync"));

const loadUser = cache(async () => {
  let navigate = useNavigate()
  let [params, setParams] = useSearchParams()
  if (params.login_token) {
    await loginWithToken(params.login_token)
    setParams({ ...params, login_token: undefined }, { replace: true })
  } else if (params.signup_token) {
    await signupWithToken(params.signup_token)
    setParams({ ...params, signup_token: undefined }, { replace: true })
  }
  let user: SignedInUser | Response = await getCurrentUser()
  if (user.id) {
    idb.initialize(`${user.id}:${user.activeProfile.id}`)
    await triggerSync(user)
    if (!user.name) {
      navigate("/welcome")
    }
  }
  return user
}, "user")

export const route = {
  preload() { loadUser() }
} satisfies RouteDefinition;


export default function PrivateSection(props: RouteSectionProps) {
  let user = createAsync(() => loadUser())
  return (
    <Show when={user()} >
      {user => (
        <SignedInUserContext.Provider value={{ user: user() }} >
          <ClientSyncService user={user()} />
          {props.children}
        </SignedInUserContext.Provider>
      )}
    </Show>
  )
}
