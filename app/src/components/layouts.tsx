import { A, useMatch, useNavigate, useSearchParams } from "@solidjs/router";
import { createMemo, JSX, ParentProps, Show, VoidProps, } from "solid-js";
import { HomeIcon, IconProps, PlusIcon, SquaresIcon } from "~/components/icons";

export function PageLayout(props: ParentProps<{
  panel?: boolean,
  nav?: boolean
}>) {
  return (
    <>
      <Show when={props.nav}>
        <Nav />
      </Show>
      <Show when={props.panel}>
        <div class="relative left-0 h-48 bg-primary animate-appear-bottom"></div>
      </Show>
      <div class="max-w-4xl mx-auto px-2 sm:px-8 pb-24 animate-appear-bottom" >
        <div class="animate-appear-bottom">
          {props.children}
        </div>
      </div>
    </>
  )
}

function Nav() {
  let [params] = useSearchParams()
  let newTransactionUrl = createMemo(() => {
    let url = new URL("/transactions/new", window.location.origin)
    if (params.year && params.month) {
      url.searchParams.set("year", params.year as string)
      url.searchParams.set("month", params.month as string)
    }
    return url.toString()
  })
  let CustomLink = (props: VoidProps<{ label: string, href: string, icon: (props: IconProps) => JSX.Element }>) => {
    return (
      <li class="flex items-center justify-center flex-grow ">
        <A href={props.href}
          activeClass="bg-primary-800"
          class="flex items-center justify-center rounded-full active:bg-primary-700 transition-colors w-28 h-full"
          end
        >
          <props.icon aria-label={props.label} />
        </A>
      </li>
    )
  }
  return (
    <nav class={`fixed bottom-2 sm:bottom-6 left-1/2 transform -translate-x-1/2 h-14 z-10 bg-gradient-to-br from-primary-900 to-primary-900 text-primary-100 border border-primary-700 p-1 rounded-full`}>
      <ul class="flex h-full max-w-5xl mx-auto gap-4">
        <CustomLink label="Home"
          href="/"
          icon={HomeIcon}
        />
        <li class="flex items-center justify-center">
          <A href={newTransactionUrl()}
            class="flex items-center justify-center rounded-full active:bg-primary-200 bg-primary-100 shadow-lg border-4 border-primary -mt-2 h-16 w-16">
            <PlusIcon class="text-primary-900 w-8 h-8" />
          </A>
        </li>
        <CustomLink label="Home"
          href="/menu"
          icon={SquaresIcon}
        />
      </ul>
    </nav >
  )
}

