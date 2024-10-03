import { A, useSearchParams } from "@solidjs/router";
import { createMemo, ParentProps, VoidProps } from "solid-js";
import { LinkButton } from "~/components/buttons";
import { HomeIcon, PlusIcon, SquaresIcon } from "~/components/icons";

export function PageLayout(props: ParentProps) {
  let [params] = useSearchParams()
  let newTransactionUrl = createMemo(() => {
    let url = new URL("new-transaction", window.location.origin)
    if (params.year && params.month) {
      url.searchParams.set("year", params.year as string)
      url.searchParams.set("month", params.month as string)
    }
    return url.toString()
  })
  return (
    <div class="px-4 pt-8 pb-24" >
      <TopNav newTransactionUrl={newTransactionUrl()} />
      {props.children}
      <BottomNav newTransactionUrl={newTransactionUrl()} />
    </div>
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

function BottomNav(props: VoidProps<{ newTransactionUrl: string }>) {
  return (
    <nav class="sm:hidden bg-white fixed bottom-0 h-16 w-screen border-t border-gray-200">
      <ul class="flex h-full">
        <li class="flex items-center justify-center flex-grow">
          <HomeIcon />
        </li>
        <li class="flex items-center justify-center flex-grow">
          <A href={props.newTransactionUrl}
            class="flex items-center justify-center rounded-full bg-primary shadow-lg h-16 w-16 -mt-4">
            <PlusIcon class="text-white w-8 h-8" />
          </A>
        </li>
        <li class="flex items-center justify-center flex-grow">
          <SquaresIcon />
        </li>
      </ul>
    </nav>
  )
}
