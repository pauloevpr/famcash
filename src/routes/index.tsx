import { useSearchParams } from "@solidjs/router";
import { createMemo, createResource, For, VoidProps } from "solid-js";
import { ChevronLeft, ChevronRight } from "~/components/icons";
import { idb } from "~/lib/idb";
import { TransactionWithRefs } from "~/lib/models";
import { dateHelper } from "~/lib/utils";


export default function Home() {
  let [params, setParams] = useSearchParams()
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
    console.log("current: ", current)
    let next = dateHelper.addMonths(new Date(current.year, current.month - 1, 1), 1)
    let url = new URL(window.location.href)
    url.searchParams.set("year", `${next.getFullYear()}`)
    url.searchParams.set("month", `${next.getMonth() + 1}`)
    return url.toString()
  })
  let previousMonthLink = createMemo(() => {
    let current = currentMonth()
    console.log("current: ", current)
    let next = dateHelper.addMonths(new Date(current.year, current.month - 1, 1), -1)
    let url = new URL(window.location.href)
    url.searchParams.set("year", `${next.getFullYear()}`)
    url.searchParams.set("month", `${next.getMonth() + 1}`)
    return url.toString()
  })
  let title = createMemo(() => {
    let current = currentMonth()
    return new Date(current.year, current.month - 1, 1).toLocaleDateString(undefined, { month: "long" })
  })

  return (
    <main class="px-4 pt-8 pb-24 relative">
      <section class="bg-white shadow-lg rounded-2xl text-center mb-4 py-8">
        <div class="grid grid-cols-[auto,1fr,auto] px-4">
          <a href={previousMonthLink()}
            aria-label="Previous month"
            class="flex items-center justify-center bg-gray-100 rounded-full border border-gray-300 h-14 w-14"
          >
            <ChevronLeft />
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
            <ChevronRight />
          </a>
        </div>
      </section>
      <section>
        <header class="sr-only">Expenses</header>
        <ul class="space-y-1.5" >
          <For each={transactions()}>
            {transaction => (
              <TransctionItem transaction={transaction} />
            )}
          </For>
        </ul>
      </section>
    </main >
  );
}

function TransctionItem(props: VoidProps<{ transaction: TransactionWithRefs }>) {
  return (
    <li>
      <a class="flex items-center gap-4 bg-white rounded-lg shadow-lg px-6 py-4">
        <span class="bg-gray-100 w-10 h-10 p-1 rounded-full flex items-center justify-center"
          aria-hidden>{props.transaction.category.icon}</span>
        <div class="flex-grow">
          <p class="text-lg">{props.transaction.name}</p>
          <time class="text-light text-sm" datetime="2024-10-28T00:00:00Z" >
            {new Date(props.transaction.date).toLocaleDateString()}
          </time>
        </div>
        <p class="text-left text-positive"
          classList={{
            "text-positive": props.transaction.amount >= 0,
            "text-negative": props.transaction.amount < 0,
          }}>

          {props.transaction.amount}</p>
      </a>
    </li>
  )
}


