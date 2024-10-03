import { A, useNavigate } from "@solidjs/router";
import { createSignal, For, Show, VoidProps } from "solid-js";
import { Button } from "~/components/buttons";
import { Account, Category, Transaction, TransactionType, TransactionWithRefs } from "~/lib/models";
import { DateOnly } from "~/lib/utils";

export function TransactionListItem(props: VoidProps<{ transaction: TransactionWithRefs }>) {
  // TODO: introduce intl formatting for amounts
  return (
    <li>
      <A
        href={`/transactions/${props.transaction.id}`}
        class="flex items-center gap-4 bg-white rounded-lg shadow-lg px-6 py-4">
        <span class="bg-gray-100 w-10 h-10 p-1 rounded-full flex items-center justify-center"
          aria-hidden>{props.transaction.category.icon}</span>
        <div class="flex-grow">
          <p class="text-lg">{props.transaction.name}</p>
          <time class="text-light text-sm" datetime="2024-10-28T00:00:00Z" >
            {new DateOnly(props.transaction.date).date.toLocaleDateString()}
          </time>
        </div>
        <p class="text-left "
          classList={{
            "text-positive": props.transaction.type === "income",
            "text-negative": props.transaction.type === "expense",
          }}>
          <Show when={props.transaction.type === "expense"}>
            <span>-</span>
          </Show>
          {props.transaction.amount}
        </p>
      </A>
    </li>
  )
}

export function TransactionForm(props: VoidProps<{
  transaction: TransactionWithRefs,
  categories: Category[],
  accounts: Account[],
  onSubmit: (transaction: Transaction) => Promise<any>,
}>) {
  let navigate = useNavigate()
  const [type, setType] = createSignal(props.transaction.type)
  const typeSelection = [
    { value: "expense", label: "Expense", style: "peer-checked:bg-negative peer-checked:text-white" },
    { value: "income", label: "Income", style: "peer-checked:bg-positive peer-checked:text-white" },
  ] satisfies { value: TransactionType, label: string, style?: string }[]

  function onSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let date = new DateOnly(data.get("date") as string)
    let transaction: Transaction = {
      id: props.transaction.id,
      name: data.get("name") as string,
      amount: parseFloat(data.get("amount") as string),
      accountId: data.get("account") as string,
      categoryId: data.get("category") as string,
      date: date.toString(),
      yearMonthIndex: date.toYearMonthString(),
      type: data.get("type") as TransactionType,
    }
    if (transaction.amount < 0) {
      transaction.amount = transaction.amount * -1
    }
    props.onSubmit(transaction)
  }

  return (
    <main>
      <h1 class="class=block px-6 py-8 font-medium text-2xl text-center">New Transaction</h1>
      <form class="block px-1 text-lg space-y-10"
        onSubmit={onSubmit}
      >
        <fieldset class="flex bg-white rounded-full border border-gray-200 p-1 focus-within:outline focus-within:outline-2">
          <legend class="sr-only">Transaction Type</legend>
          <For each={typeSelection}>
            {(item) => (
              <div>
                <input type="radio"
                  id={`type-${item.value}`}
                  value={item.value}
                  name="type"
                  class="peer sr-only"
                  checked={item.value === type()}
                  onChange={_ => setType(item.value)}
                />
                < label
                  for={`type-${item.value}`}
                  class={item.style + " inline-flex items-center peer-checked:font-medium cursor-pointer rounded-full px-6 h-12"}>
                  {item.label}
                </label>
              </div>
            )}
          </For>
        </fieldset>
        <div class="grid grid-cols-[auto,1fr] bg-white rounded-xl border border-gray-200 ">
          <label for="name"
            class="flex items-center h-full px-6"
          >Name</label>
          <input
            id="name"
            name="name"
            required
            placeholder="Enter name"
            class="h-12 px-4 rounded-tr-xl w-full"
            value={props.transaction.name}
          />
          <label
            for="category"
            class="flex items-center h-full px-6 border-t border-gray-200"
          >Category</label>
          <select
            id="category"
            name="category"
            class="h-12 px-4 border-t border-gray-200 rounded-br-xl bg-transparent w-full"
          >
            <For each={props.categories}>
              {category => (
                <option value={category.id}
                  selected={category.id == props.transaction.categoryId}
                >
                  {`${category.icon} ${category.name}`}
                </option>
              )}
            </For>
          </select>
          <label
            for="date"
            class="flex items-center h-full px-6 border-t border-gray-200"
          >
            Date
          </label>
          <input
            id="date"
            type="date"
            name="date"
            required
            placeholder="Pick Date"
            class="h-12 px-4 border-t border-gray-200 bg-transparent w-full"
            value={props.transaction.date}
          />
          <label
            for="account"
            class="flex items-center h-full px-6 border-t border-gray-200"
          >Account</label>
          <select
            id="account"
            name="account"
            class="h-12 px-4 border-t border-gray-200 rounded-br-xl bg-transparent w-full"
          >
            <For each={props.accounts}>
              {account => (
                <option value={account.id}
                  selected={account.id === props.transaction.accountId}>
                  {`${account.icon} ${account.name}`}
                </option>
              )}
            </For>
          </select>
        </div>
        <div class="bg-white rounded-xl border border-gray-200">
          <label class="sr-only"
            for="amount"
          >Amount</label>
          <input
            id="amount"
            name="amount"
            type="number"
            class="w-full h-16 text-xl text-center rounded-xl"
            step="0.01"
            value={props.transaction.amount}
            min={0}
            max={Number.MAX_VALUE}
          />
        </div>
        <div class="flex items-center flex-col gap-2">
          <Show when={type() === "expense"}>
            <Button label="Save Expense"
              style="negative"
            />
          </Show>
          <Show when={type() === "income"}>
            <Button label="Save Income"
              style="positive"
            />
          </Show>
          <Button label="Cancel"
            type="button"
            style="neutral"
            onclick={() => navigate(-1)}
          />
        </div>
      </form>
    </main>
  )
}
