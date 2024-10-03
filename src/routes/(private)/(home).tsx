
import { useSearchParams } from "@solidjs/router";
import { createMemo, createResource, For } from "solid-js";
import { ChevronLeftIcon, ChevronRightIcon } from "~/components/icons";
import { PageLayout } from "~/components/layouts";
import { idb } from "~/lib/idb";
import { DateOnly } from "~/lib/utils";
import { TransactionListItem } from "./transactions/(components)";


export default function Home() {
  let [params] = useSearchParams()
  let currentMonth = createMemo(() => {
    let now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth() + 1
    if (params.month && params.year) {
      year = parseInt(params.year)
      month = parseInt(params.month)
    }
    return { year, month }
  })
  let [transactions, _] = createResource(() => `${currentMonth().year}-${currentMonth().month}`, async () => {
    let current = currentMonth()
    return await idb.getTransactionsByMonth(current.year, current.month)
  })
  let nextMonthLink = createMemo(() => {
    let current = currentMonth()
    let next = DateOnly.fromYearMonth(current.year, current.month).addMonths(1)
    let url = new URL(window.location.href)
    url.searchParams.set("year", `${next.getFullYear()}`)
    url.searchParams.set("month", `${next.getMonth() + 1}`)
    return url.toString()
  })
  let previousMonthLink = createMemo(() => {
    let current = currentMonth()
    let previous = DateOnly.fromYearMonth(current.year, current.month).addMonths(-1)
    let url = new URL(window.location.href)
    url.searchParams.set("year", `${previous.getFullYear()}`)
    url.searchParams.set("month", `${previous.getMonth() + 1}`)
    return url.toString()
  })
  let title = createMemo(() => {
    let current = currentMonth()
    return DateOnly.fromYearMonth(current.year, current.month).date.toLocaleDateString(undefined, { month: "long" })
  })

  return (
    <PageLayout>
      <main class="relative">
        <section class="bg-white shadow-lg rounded-2xl text-center border border-gray-100 mb-4 py-8">
          <div class="grid grid-cols-[auto,1fr,auto] px-4">
            <a href={previousMonthLink()}
              aria-label="Previous month"
              class="flex items-center justify-center bg-gray-100 rounded-full border border-gray-300 h-14 w-14"
            >
              <ChevronLeftIcon />
            </a>
            <header class="pb-6">
              <span class="sr-only">Summary for </span>
              <span >{currentMonth().year}</span>
              <span class="block font-medium text-xl">{title()}</span>
            </header>
            <a href={nextMonthLink()}
              aria-label="Next month"
              class="flex items-center justify-center bg-gray-100 rounded-full border border-gray-300 h-14 w-14"
            >
              <ChevronRightIcon />
            </a>
          </div>
        </section>
        <section>
          <header class="sr-only">Expenses</header>
          <ul class="space-y-1.5" >
            <For each={transactions()}>
              {transaction => (
                <TransactionListItem transaction={transaction} />
              )}
            </For>
          </ul>
        </section>
      </main >
    </PageLayout>
  );
}

