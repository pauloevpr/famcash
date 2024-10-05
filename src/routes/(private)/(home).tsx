import { useSearchParams } from "@solidjs/router";
import { createMemo, createResource, For, Show } from "solid-js";
import { ChevronLeftIcon, ChevronRightIcon } from "~/components/icons";
import { PageLayout } from "~/components/layouts";
import { idb } from "~/lib/idb";
import { DateOnly } from "~/lib/utils";
import { TransactionListItem } from "./transactions/(components)";
import { calculator } from "~/lib/calculator";


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
  }, { initialValue: [] })
  let nextMonthLink = createMemo(() => {
    let current = currentMonth()
    let next = DateOnly.fromYearMonth(current.year, current.month).addMonths(1)
    let url = new URL(window.location.href)
    url.searchParams.set("year", `${next.year}`)
    url.searchParams.set("month", `${next.month}`)
    return url.toString()
  })
  let previousMonthLink = createMemo(() => {
    let current = currentMonth()
    let previous = DateOnly.fromYearMonth(current.year, current.month).addMonths(-1)
    let url = new URL(window.location.href)
    url.searchParams.set("year", `${previous.year}`)
    url.searchParams.set("month", `${previous.month}`)
    return url.toString()
  })
  let title = createMemo(() => {
    let current = currentMonth()
    return DateOnly.fromYearMonth(current.year, current.month).date.toLocaleDateString(undefined, { month: "long" })
  })
  let summary = createMemo(() => {
    return calculator.summary(transactions())
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
          <p class="block pb-8 font-medium text-3xl"
            classList={{
              "text-negative": summary().total < 0,
              "text-positive": summary().total >= 0,
            }}
          >{summary().total}</p>
          <div class="inline-flex items-center text-center bg-gray-100 rounded-xl text-light px-4 py-2">
            <p class="px-4 text-negative"
              classList={{
                "text-negative": summary().carryOver < 0,
                "text-positive": summary().carryOver >= 0,
              }}
            >
              {summary().carryOver}
              <span class="block text-light text-xs">Carry Over</span>
            </p>
            <p class="px-4 text-positive">
              {summary().totalIncome}
              <span class="block text-light text-xs">Income</span>
            </p>
            <p class="px-4 text-negative">
              {summary().totalExpense}
              <span class="block text-light text-xs">Expense</span>
            </p>
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

