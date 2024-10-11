import { A, useMatch, useNavigate, useSearchParams } from "@solidjs/router";
import { createMemo, ParentProps, Show, VoidProps } from "solid-js";
import { LinkButton } from "~/components/buttons";
import { CloseIcon, HomeIcon, PlusIcon, SquaresIcon } from "~/components/icons";

export function PageLayout(props: ParentProps) {
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
    <div class="max-w-5xl mx-auto" >
      <BottomNav newTransactionUrl={newTransactionUrl()} />
      {props.children}
    </div>
  )
}

function BottomNav(props: VoidProps<{ newTransactionUrl: string }>) {
  let navigate = useNavigate()
  let matchMenu = useMatch(() => "/menu")
  return (
    <nav class={`fixed left-0 bottom-0 h-16 w-screen border-2 border-gray-200 z-10 bg-gradient-to-r from-white via-primary-100 to-white border-white/50
                 sm:relative sm:mt-8 sm:mx-6 sm:mb-8 sm:rounded-full sm:w-auto `}>
      <ul class="flex h-full max-w-5xl mx-auto">
        <li class="flex items-center justify-center flex-grow">
          <A href="/">
            <HomeIcon aria-label="Home" />
          </A>
        </li>
        <li class="flex items-center justify-center">
          <A href={props.newTransactionUrl}
            class="flex items-center justify-center rounded-full bg-primary shadow-lg h-16 w-16 -mt-4 sm:mt-0">
            <PlusIcon class="text-white w-8 h-8" />
          </A>
        </li>
        <li class="flex items-center justify-center flex-grow">
          <Show when={matchMenu()}>
            <button
              onClick={() => navigate(-1)}
            >
              <CloseIcon aria-label="Close Menu" />
            </button>
          </Show>
          <Show when={!matchMenu()}>
            <A href="/menu"
            >
              <SquaresIcon aria-label="Menu" />
            </A>
          </Show>
        </li>
      </ul>
    </nav>
  )
}

function TopNav(props: VoidProps<{ newTransactionUrl: string }>) {
  return (
    <nav class="hidden sm:block">
      <ul class="flex items-center h-16">
        <li class="flex-grow">
        </li>
        <li class="flex-grow">
        </li>
        <li>
          <LinkButton label="Add"
            href={props.newTransactionUrl}
            style="primary"
            icon={<PlusIcon class="h-6 w-6" />}
          />
        </li>
      </ul>
    </nav>
  )
}

