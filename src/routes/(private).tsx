import { createAsync, RouteDefinition, RouteSectionProps } from "@solidjs/router";
import { Show } from "solid-js";
import { getUser } from "~/lib/client";


export const route = {
  preload() { getUser() }
} satisfies RouteDefinition;

export default function PrivateSection(props: RouteSectionProps) {
  let user = createAsync(() => getUser())
  return (
    <Show when={user()} >
      {props.children}
    </Show>
  )
}

