import { cache, createAsync, RouteDefinition, RouteSectionProps, useLocation, useSearchParams } from "@solidjs/router";
import { getCurrentUser, loginWithToken } from "~/lib/server";

const getUser = cache(async () => {
  let [params, setParams] = useSearchParams()
  if (params.auth_token) {
    await loginWithToken(params.auth_token)
    setParams({ ...params, auth_token: undefined }, { replace: true })
  }
  return await getCurrentUser()
}, "user")

export const route = {
  preload() { getUser() }
} satisfies RouteDefinition;

export default function PrivateSection(props: RouteSectionProps) {
  createAsync(() => getUser(), { deferStream: true });
  return (
    <>{props.children}</>
  )
}
