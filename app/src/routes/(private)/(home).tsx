import { A, createAsync, useSearchParams } from "@solidjs/router";
import { createMemo, For, Show, useContext, VoidProps } from "solid-js";
import { ChevronLeftIcon, ChevronRightIcon } from "~/components/icons";
import { PageLayout } from "~/components/layouts";
import { DateOnly } from "~/lib/utils";
import { TransactionListItem } from "./transactions/(components)";
import { useTabs } from "~/components/tabs";
import { CategoryWithSpending } from "~/lib/models";
import { Button } from "~/components/buttons";
import { store } from "~/lib/wstore";
import { AppContext } from "~/components/context";

export default function Home() {
  let { formatter } = useContext(AppContext)
  let local = store.use()
  let [params] = useSearchParams()
  let currentMonth = createMemo(() => {
    let now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth() + 1
    if (params.month && params.year) {
      year = parseInt(params.year as string)
      month = parseInt(params.month as string)
    }
    let LastMonthEnd = new Date()
    LastMonthEnd.setDate(-1)
    let isPast = DateOnly.fromYearMonth(year, month).time < LastMonthEnd.getTime()
    return { year, month, isPast }
  })
  let categories = createAsync(() => {
    return local.categories.all()
  }, { initialValue: [] })
  let transactions = createAsync(() => {
    return local.transactions.byMonth(currentMonth().year, currentMonth().month)
  }, { initialValue: [] })
  let spending = createMemo(() => {
    let spending = local.calculateSpendingByCategory(transactions())
    return categories().map(category => {
      let item = spending.find(x => x.id === category.id)
      if (!item) {
        item = {
          ...category,
          transactions: [],
          total: 0,
          remaining: category.plan?.limit || 0
        }
      }
      return item
    })
  })
  let nextMonthLink = createMemo(() => {
    let current = currentMonth()
    let next = DateOnly.fromYearMonth(current.year, current.month).addMonths(1)
    let url = new URL(window.location.href)
    url.pathname = "/"
    url.searchParams.set("year", `${next.year}`)
    url.searchParams.set("month", `${next.month}`)
    return url.toString()
  })
  let previousMonthLink = createMemo(() => {
    let current = currentMonth()
    let previous = DateOnly.fromYearMonth(current.year, current.month).addMonths(-1)
    let url = new URL(window.location.href)
    url.pathname = "/"
    url.searchParams.set("year", `${previous.year}`)
    url.searchParams.set("month", `${previous.month}`)
    return url.toString()
  })
  let title = createMemo(() => {
    let current = currentMonth()
    return DateOnly.fromYearMonth(current.year, current.month).date.toLocaleDateString(undefined, { month: "long" })
  })
  let summary = createMemo(() => {
    return local.calculateSummary(currentMonth().year, currentMonth().month, transactions(), categories())
  })
  let { Tab, TabPanel } = useTabs("Transactions Views", () => [
    { label: "Transactions", key: "transactions" },
    { label: "Spending", key: "spending" },
  ], {
    key: "home-transactions-tab",
    initialSelection: "transactions",
  })


  return (
    <PageLayout panel nav>
      <main class="relative -mt-40">
        <section class="rounded text-center surface mb-4 py-8 px-2">
          <div class="grid grid-cols-[auto,1fr,auto] px-4">
            <a href={previousMonthLink()}
              aria-label="Previous month"
              class="flex items-center justify-center surface-elevated rounded-full h-14 w-14"
            >
              <ChevronLeftIcon />
            </a>
            <header class="pb-6">
              <span class="sr-only">Summary for </span>
              <span class="text-light">{currentMonth().year}</span>
              <span class="block font-medium text-xl">{title()}</span>
            </header>
            <a href={nextMonthLink()}
              aria-label="Next month"
              class="flex items-center justify-center surface-elevated rounded-full h-14 w-14"
            >
              <ChevronRightIcon />
            </a>
          </div>
          <div class="pb-10 pt-2">
            <p class="block font-medium text-3xl"
              classList={{
                "text-negative": summary().total < 0,
                "text-positive": summary().total >= 0,
              }}
            >
              {formatter.currencyShort(summary().total)}
            </p>
            <Show when={!currentMonth().isPast}>
              <span class="inline-block text-sm badge-primary mt-2">
                Forecast
              </span>
            </Show>
          </div>
          <div class="inline-flex gap-6 sm:gap-10 items-center text-center surface-elevated rounded-xl text-light px-4 py-2">
            <p class=" text-negative"
              classList={{
                "text-negative": summary().carryOver < 0,
                "text-positive": summary().carryOver > 0,
              }}
            >
              {formatter.currencyShort(summary().carryOver)}
              <span class="block text-light text-xs">Carry Over</span>
            </p>
            <p>
              {`${formatter.currencyShort(summary().totalExpenses)} / ${formatter.currencyShort(summary().plannedExpenses)}`}
              <span class="block text-light text-xs">Expenses</span>
            </p>
            <p>
              {formatter.currencyShort(summary().totalIncome)}
              <span class="block text-light text-xs">Income</span>
            </p>
          </div>
        </section>
        <section>
          <header class="sr-only">Expenses</header>
          <Tab>
            <TabPanel key="transactions">
              <ul class="space-y-1 rounded-xl surface" >
                <For each={transactions()}>
                  {(transaction, index) => (
                    <li classList={{
                      "border-t border-gray-200": index() > 0
                    }}>
                      <TransactionListItem transaction={transaction}
                      />
                    </li>
                  )}
                </For>
              </ul>
            </TabPanel>
            <TabPanel key="spending">
              <ul class="space-y-1" >
                <For each={spending()}>
                  {item => (
                    <CategorySpending category={item} />
                  )}
                </For>
              </ul>
            </TabPanel>
          </Tab>
        </section>
      </main >
    </PageLayout >
  );
}

function CategorySpending(props: VoidProps<{ category: CategoryWithSpending }>) {
  let { formatter } = useContext(AppContext)
  let isNegative = createMemo(() => props.category.remaining < 0 && !!props.category.plan)
  let barWidth = createMemo(() => {
    let totalPlanned = props.category.plan?.limit ?? 0
    if (totalPlanned === 0) return 0
    let percentage = (props.category.total / totalPlanned) * 100
    if (percentage > 100) percentage = 100
    return `${percentage}%`
  })

  return (
    <li class="border-l-8 rounded-lg "
      classList={{
        "border-positive/30": !isNegative(),
        "border-negative/30": isNegative(),
      }}
    >
      <details class="group surface [&[open]]:mb-10">
        <summary class="flex items-center gap-3 sm:gap-4 cursor-pointer py-6 px-4 sm:px-6">
          <span class="bg-gray-100 w-10 h-10 p-1 rounded-full flex items-center justify-center"
            aria-hidden>
            {props.category.icon}
          </span>
          <span class="block flex-grow group-open:font-semibold">
            {props.category.name}
          </span>
          <span class="transition-all">
            <span >
              <span class="sr-only" >Total Spent:</span>
              {formatter.currency(props.category.total) + " / "}
            </span>
            <span class="block sm:inline text-light font-normal" >
              <span class="sr-only" >Planned Spent:</span>
              {`${formatter.currency(props.category.plan?.limit || 0)} `}
            </span>
          </span>
          <ChevronRightIcon class="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform duration-200" />
        </summary>
        <div>
          <div class="border-t border-gray-200">
            <Show when={!props.category.plan}>
              <A class="block items-center gap-2 px-6 py-6 active:bg-gray-100 transition-colors"
                href={`/categories/${props.category.id}/plan`}
              >
                <span class="block flex-grow">
                  <span class="block text-light text-sm pb-4">This category has no spending plan yet</span>
                </span>
                <Button style="neutral"
                  label="Add Plan"
                />
              </A>
            </Show>
            <Show when={props.category.plan}>
              {plan => (
                <A class="flex items-center gap-6 px-6 py-6 active:bg-gray-100 transition-colors"
                  href={`/categories/${props.category.id}/plan`}
                >
                  <span class="block flex-grow">
                    <Show when={isNegative()}>
                      <p class="block pb-2 text-light">
                        <span class="font-medium text-negative"
                        >
                          {formatter.currency(props.category.remaining * -1)}
                        </span>
                        {' '}overspent from {formatter.currency(plan().limit)} planned
                      </p>
                    </Show>
                    <Show when={!isNegative()}>
                      <p class="block pb-2 text-light">
                        <span class="font-medium text-positive"
                        >
                          {formatter.currency(props.category.remaining)}
                        </span>
                        {' '}left from {formatter.currency(plan().limit)} planned
                      </p>
                    </Show>
                    <div aria-hidden class=" h-4"
                      classList={{
                        "bg-positive/10": !isNegative(),
                        "bg-negative/10": isNegative(),
                      }}
                    >
                      <div class="h-full w-[60%]"
                        classList={{
                          "bg-positive/40": !isNegative(),
                          "bg-negative/40": isNegative(),
                        }}
                        style={`width: ${barWidth()};`}
                      ></div>
                    </div>
                  </span>
                  <ChevronRightIcon class="w-5 h-5 text-positive" />
                </A>
              )}
            </Show>
          </div>
          <ul class="space-y-1.5" >
            <For each={props.category.transactions}>
              {(transaction) => (
                <li>
                  <A
                    href={`/transactions/${transaction.id}`}
                    class="flex items-center gap-4 px-6 py-2 border-t border-gray-200">
                    <div class="flex-grow">
                      <p>{transaction.name || transaction.category.name}</p>
                      <time class="block text-light text-sm" datetime="2024-10-28T00:00:00Z" >
                        {new DateOnly(transaction.date).date.toLocaleDateString()}
                      </time>
                    </div>
                    <p class="text-left"
                    >
                      {formatter.currency(transaction.amount)}
                    </p>
                  </A>
                </li>
              )}
            </For>
          </ul>
        </div>
      </details>
    </li >
  )
}
