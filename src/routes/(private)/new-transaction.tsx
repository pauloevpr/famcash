import { useNavigate, useSearchParams } from "@solidjs/router";
import { createResource, createSignal, For, Show, VoidProps } from "solid-js";
import { Button } from "~/components/buttons";
import { idb } from "~/lib/idb";
import { DateOnly } from "~/lib/utils";
import { Account, Category, Transaction, TransactionType, TransactionWithRefs } from "~/lib/models";

export default function NewTransactionPage() {
  let navigate = useNavigate()
  let [params] = useSearchParams()
  let [data] = createResource(async () => {
    let dateRaw = new Date()
    if (params.month && params.year) {
      dateRaw.setFullYear(parseInt(params.year))
      dateRaw.setMonth(parseInt(params.month) - 1, 1)
    }
    let date = new DateOnly(dateRaw)
    let accounts = (await idb.getAccounts())
    let categories = (await idb.getCategories())
    let transaction: TransactionWithRefs = {
      name: "",
      type: "expense",
      id: new Date().getTime().toString(),
      accountId: accounts[0]?.id,
      account: accounts[0],
      categoryId: categories[0].id,
      category: categories[0],
      amount: 0,
      yearMonthIndex: date.toYearMonthString(),
      date: date.toString(),
    }
    return {
      transaction,
      accounts,
      categories,
    }
  })
  async function onSubmit(transaction: Transaction) {
    await idb.upsertTransaction(transaction)
    navigate(-1)
  }
  return (
    <Show when={data()}>
      {data => (
        <TransactionForm transaction={data().transaction}
          categories={data().categories}
          accounts={data().accounts}
          onSubmit={onSubmit}
        />
      )}
    </Show>
  )
}

function TransactionForm(props: VoidProps<{
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
      id: `${new Date().getTime()}`,
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
            placeholder="Select Category"
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
            placeholder="Select Account"
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
