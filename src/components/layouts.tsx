import { A, useMatch, useNavigate, useSearchParams } from "@solidjs/router";
import { createMemo, ParentProps, Show, VoidProps } from "solid-js";
import { HomeIcon, PlusIcon, SquaresIcon } from "~/components/icons";

export function PageLayout(props: ParentProps<{ panel?: boolean }>) {
  let [params] = useSearchParams()
  let newTransactionUrl = createMemo(() => {
    let url = new URL("/transactions/new", window.location.origin)
    if (params.year && params.month) {
      url.searchParams.set("year", params.year as string)
      url.searchParams.set("month", params.month as string)
    }
    return url.toString()
  })
  return (
    <>
      <Show when={props.panel}>
        <div class="relative left-0 h-52 bg-primary"></div>
      </Show>
      <div class="max-w-4xl mx-auto px-2 sm:px-8" >
        <Nav newTransactionUrl={newTransactionUrl()} />
        {props.children}
      </div>
    </>
  )
}

function Nav(props: VoidProps<{ newTransactionUrl: string }>) {
  let navigate = useNavigate()
  let matchMenu = useMatch(() => "/menu")
  return (
    <nav class={`fixed bottom-2 sm:bottom-6 left-1/2 transform -translate-x-1/2 h-16 z-10 bg-gradient-to-br from-primary-900 to-primary-900 text-primary-100 border border-gray-200 p-1 rounded-full shadow-lg shadow-primary-200`}>
      <ul class="flex h-full max-w-5xl mx-auto gap-4">
        <li class="flex items-center justify-center flex-grow ">
          <A href="/"
            activeClass="bg-primary-800 rounded-full"
            class="flex items-center justify-center w-28 h-full"
            end
          >
            <HomeIcon aria-label="Home" />
          </A>
        </li>
        <li class="flex items-center justify-center">
          <A href={props.newTransactionUrl}
            class="flex items-center justify-center rounded-full bg-primary-100 shadow-lg border-4 border-primary -mt-2 h-[70px] w-[70px]">
            <PlusIcon class="text-primary-900 w-8 h-8" />
          </A>
        </li>
        <li class="flex items-center justify-center flex-grow ">
          <A href="/menu"
            activeClass="bg-primary-800 rounded-full"
            onClick={(e) => {
              if (matchMenu()) {
                e.preventDefault()
                navigate(-1)
              }
            }}
            class="flex items-center justify-center w-28 h-full">
            <SquaresIcon aria-label="Menu" />
          </A>
        </li>
      </ul>
    </nav >
  )
}

