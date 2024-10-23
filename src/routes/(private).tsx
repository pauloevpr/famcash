import { createAsync, RouteDefinition, RouteSectionProps } from "@solidjs/router";
import { getUser } from "~/lib/client";


export const route = {
  preload() { getUser() }
} satisfies RouteDefinition;

export default function PrivateSection(props: RouteSectionProps) {
  createAsync(() => getUser())
  return (
    <>{props.children}</>
  )
}





