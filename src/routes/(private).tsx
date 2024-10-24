import { createAsync, RouteDefinition, RouteSectionProps } from "@solidjs/router";
import { Show } from "solid-js";
import { clientOnly } from "@solidjs/start"
import { getUser } from "~/lib/client";

const ClientSyncService = clientOnly(() => import("~/lib/sync"));


export const route = {
  preload() { getUser() }
} satisfies RouteDefinition;

export default function PrivateSection(props: RouteSectionProps) {
  let user = createAsync(() => getUser())
  return (
    <Show when={user()} >
      {user => (
        <>
          <ClientSyncService user={user()} />
          {props.children}
        </>
      )}
    </Show>
  )
}

