import { A, useNavigate } from "@solidjs/router";
import { createMemo, createSignal, For, Show, useContext, VoidProps } from "solid-js";
import { Button } from "~/components/buttons";
import { Category, RecurrencyInterval, Transaction, TransactionRecurrency, TransactionType, TransactionWithRefs } from "~/lib/models";
import { store } from "~/lib/wstore";
import { DateOnly } from "~/lib/utils";
import { AppContext } from "~/components/context";
import { GitPullRequestArrow } from "~/components/icons";
import { PageLayout } from "~/components/layouts";

export function TransactionListItem(props: VoidProps<{
  transaction: TransactionWithRefs,
}>) {
  let { formatter } = useContext(AppContext)
  let isPositive = createMemo(() => {
    if (props.transaction.type === "income") return true
    if (props.transaction.type === "carryover" && props.transaction.amount > 0) return true
    return false
  })
  let manualCarryOver = createMemo(() => props.transaction.carryOver?.type === "manual")
  let autoCarryOver = createMemo(() => props.transaction.carryOver?.type === "auto")
  let normalizedAmount = createMemo(() => {
    let amount = props.transaction.amount
    if (amount < 0) {
      amount = amount * -1
    }
    return amount
  })
  return (
    <A
      href={`/transactions/${props.transaction.id}`}
      class="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4">
      <span class="bg-gray-100 text-lg w-12 h-12 p-1 rounded-full flex items-center justify-center"
        aria-hidden>
        <Show when={props.transaction.type === "carryover"}
          fallback={props.transaction.category.icon}>
          <GitPullRequestArrow class="text-primary w-5 h-5" />
        </Show>
      </span>
      <div class="flex-grow">
        <p>
          {props.transaction.name || props.transaction.category.name}
        </p>
        <time class="text-light text-sm" datetime="2024-10-28T00:00:00Z" >
          {new DateOnly(props.transaction.date).date.toLocaleDateString()}
        </time>
      </div>
      <Show when={manualCarryOver()}>
        <p class="badge-primary text-sm">
          Confirmed
        </p>
      </Show>
      <Show when={autoCarryOver()}>
        <p class="badge-neutral text-sm">
          Unconfirmed
        </p>
      </Show>
      <p class="text-left"
        classList={{
          "text-positive-700 bg-positive-600/10 font-medium px-3 py-0.5 rounded-md before:content-['+']": isPositive(),
        }}>
        {formatter.currency(normalizedAmount())}
      </p>
    </A>
  )
}

export function TransactionForm(props: VoidProps<{
  transaction: TransactionWithRefs,
  categories: Category[],
  onSubmit: (transaction: Transaction) => Promise<void>,
  onDelete?: (id: string) => Promise<void>,
  type?: TransactionType
}>) {
  let local = store.use()
  let navigate = useNavigate()
  let [type, setType] = createSignal(props.type || props.transaction.type)
  let typeSelection = createMemo(() => {
    type TransactionTypeSelection = { value: TransactionType, label: string, style?: string }
    let expense: TransactionTypeSelection = { value: "expense", label: "Expense", style: "peer-checked:bg-negative peer-checked:text-white" }
    let income: TransactionTypeSelection = { value: "income", label: "Income", style: "peer-checked:bg-positive peer-checked:text-white" }
    if (props.type === "expense") return [expense]
    if (props.type === "income") return [income]
    return [expense, income]
  })

  function onSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let date = new DateOnly(data.get("date") as string)
    let transaction: Transaction = {
      id: props.transaction.id,
      name: data.get("name") as string,
      amount: parseFloat(data.get("amount") as string),
      categoryId: data.get("category") as string,
      date: date.toString(),
      yearMonthIndex: date.toYearMonthString(),
      type: data.get("type") as TransactionType,
    }
    if (transaction.type === "income") {
      transaction.categoryId = local.categories.static.income().id
    }
    if (data.get("recurrency") === "on") {
      let endDate = data.get("repeatEndDate") as string
      transaction.recurrency = {
        interval: data.get("repeatInterval") as RecurrencyInterval,
        multiplier: parseInt(data.get("recurrencyMultiplier") as string),
        endDate: endDate ? new DateOnly(endDate).toString() : undefined,
      }
    }
    if (transaction.amount < 0) {
      transaction.amount = transaction.amount * -1
    }
    props.onSubmit(transaction)
  }

  let CancelButton = (props: VoidProps<{ label?: string }>) => (
    <div class="pt-8">
      <Button label={props.label || "Cancel"}
        type="button"
        style="neutral"
        onclick={() => navigate(-1)}
      />
    </div>
  )

  let DeleteButton = () => (
    <Show when={props.onDelete}>
      {(_) => (
        <div class="pt-4">
          <Button label="Delete"
            type="button"
            style="neutral"
            onclick={() => props.onDelete?.(props.transaction.id)}
          />
        </div>
      )}
    </Show>
  )

  return (
    <PageLayout>
      <Show when={props.transaction.type === "carryover"}>
        <CarryOverForm transaction={props.transaction}
          onSubmit={props.onSubmit} />
      </Show>
      <Show when={props.transaction.type !== "carryover"}>
        <main class="max-w-3xl mx-auto">
          <h1 class="class=block px-6 py-8 font-medium text-2xl text-center">Transaction</h1>
          <form class="flex flex-col gap-10 px-1"
            onSubmit={onSubmit}
          >
            <Show when={type() !== "carryover"}>
              <fieldset class="flex surface rounded-full p-1 focus-within:outline focus-within:outline-2">
                <legend class="sr-only">Transaction Type</legend>
                <For each={typeSelection()}>
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
              <Show when={type() === "expense"} >
                <div class="grid grid-cols-[auto,1fr] surface rounded">
                  <FieldCategory categories={props.categories}
                    value={props.transaction.categoryId}
                  />
                  <Border />
                  <FieldDate value={props.transaction.date} />
                  <Border />
                  <FieldName label="Note"
                    placeholder="Optional"
                    value={props.transaction.name} />
                </div>
                <FieldAmount value={props.transaction.amount}
                  min={0}
                />
                <FieldRecurrency recurrency={props.transaction.recurrency} />
                <div>
                  <Button label="Save Expense"
                    style="negative"
                  />
                  <DeleteButton />
                  <CancelButton />
                </div>
              </Show>
              <Show when={type() === "income"} >
                <div class="grid grid-cols-[auto,1fr] surface rounded">
                  <FieldName label="Name"
                    required
                    placeholder="Enter Name"
                    value={props.transaction.name} />
                  <Border />
                  <FieldDate value={props.transaction.date} />
                </div>
                <FieldAmount value={props.transaction.amount}
                  min={0}
                />
                <FieldRecurrency recurrency={props.transaction.recurrency} />
                <div>
                  <Button label="Save Income"
                    style="positive"
                  />
                  <DeleteButton />
                  <CancelButton />
                </div>
              </Show>
            </Show>
          </form>
        </main >
      </Show>
    </PageLayout>
  )
}

function CarryOverForm(props: VoidProps<{
  transaction: Transaction,
  onSubmit: (transaction: Transaction) => Promise<void>,
}>) {
  let navigate = useNavigate()
  let canSaveCarryOver = createMemo(() => {
    let endOfThisMonth = new Date()
    endOfThisMonth.setMonth(endOfThisMonth.getMonth() + 1)
    endOfThisMonth.setDate(-1)
    let transaction = new DateOnly(props.transaction.date)
    return transaction.time < endOfThisMonth.getTime()
  })
  let carryOverDate = createMemo(() => {
    return new DateOnly(props.transaction.date).date.toLocaleDateString(
      undefined, { year: "numeric", month: "long" }
    )
  })

  function onSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let transaction = JSON.parse(JSON.stringify(props.transaction)) as Transaction
    transaction.amount = parseFloat(data.get("amount") as string)
    props.onSubmit(transaction)
  }

  let CancelButton = (props: VoidProps<{ label?: string }>) => (
    <div class="pt-8">
      <Button label={props.label || "Cancel"}
        type="button"
        style="neutral"
        onclick={() => navigate(-1)}
      />
    </div>
  )

  return (
    <main class="max-w-3xl mx-auto">
      <h1 class="class=block px-6 py-8 font-medium text-2xl text-center">
        Carry Over
      </h1>
      <form class="flex flex-col gap-10 px-1"
        onSubmit={onSubmit}
      >
        <div class="grid grid-cols-[auto,1fr] surface rounded">
          <p class="flex items-center px-6 py-3">
            Month
          </p>
          <p class="flex items-center px-6 text-light py-3">
            {carryOverDate()}
          </p>
          <Border />
          <p class="flex items-center px-6 py-3">
            Status
          </p>
          <Show when={props.transaction.carryOver?.type === "auto"}>
            <p class="flex items-center px-6 text-light py-3">
              Unconfirmed - this carryover is auto-calculated
            </p>
          </Show>
          <Show when={props.transaction.carryOver?.type === "manual"}>
            <div class="flex items-center px-6 text-light py-3">
              <p class=" badge-primary">
                Confirmed
              </p>
            </div>
          </Show>
        </div>
        <FieldAmount value={props.transaction.amount}
          colors
        />
        <div>
          <Show when={canSaveCarryOver()}
            fallback={<CancelButton label="Back" />}
          >
            <Button label={props.transaction.carryOver?.type === "auto" ? "Confim and Save Carry Over" : "Save Carry Over"}
              style="primary"
            />
            <CancelButton />
          </Show>
        </div>
      </form>
    </main >
  )
}

function Border() {
  return (
    <div class="border-t border-gray-200 col-span-2" />
  )
}

function FieldRecurrency(props: VoidProps<{ recurrency?: TransactionRecurrency }>) {
  let intervals = [
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
    { value: "year", label: "Year" },
  ] satisfies { value: RecurrencyInterval, label: string }[]

  return (
    <div class="group grid grid-cols-[auto,1fr] surface rounded">
      <label class="group/repeat focus-within:outline-2 focus-within:outline flex items-center justify-between px-6 gap-6 col-span-2 h-12 rounded-xl group-has-[input:checked]:rounded-b-none">
        Repeat
        <input
          name="recurrency"
          type="checkbox"
          class="sr-only peer"
          checked={!!props.recurrency}
        />
        <span class="block h-6 rounded-full w-10 bg-gray-200">
          <span class="block group-has-[:checked]/repeat:bg-primary group-has-[:checked]/repeat:translate-x-4 transition-transform duration-300 bg-white shadow rounded-full h-6 w-6"></span>
        </span>
      </label>
      <label for="repeatInterval" class="hidden group-has-[input:checked]:flex items-center h-full px-6 border-t border-gray-200 ">Every
      </label>
      <div class="hidden group-has-[input:checked]:flex items-center flex-grow gap-4 border-t border-gray-200">
        <input id="recurrencyMultiplier"
          name="recurrencyMultiplier"
          class="h-12 px-4 bg-transparent w-full"
          type="number"
          required
          min={1}
          max={365}
          value={props.recurrency?.multiplier || 1} />
        <select id="repeatInterval"
          name="repeatInterval"
          class="h-12 px-4 bg-transparent w-full"
        >
          <For each={intervals}>{
            interval => (
              <option value={interval.value}
                selected={interval.value === props.recurrency?.interval}
              >{interval.label}</option>
            )
          }</For>
        </select>
      </div>
      <label for="repeatEndDate"
        class="hidden group-has-[input:checked]:flex items-center h-full px-6 border-t border-gray-200">
        End Date
      </label>
      <input type="date"
        name="repeatEndDate"
        placeholder="Pick End Date"
        class="hidden group-has-[input:checked]:block h-12 px-4 border-t border-gray-200 rounded-br-xl bg-transparent w-full"
        value={props.recurrency?.endDate}
        id="repeatEndDate" />
    </div>

  )
}

function FieldAmount(props: VoidProps<{ value: number, colors?: boolean, min?: number }>) {
  let [amount, setAmount] = createSignal(props.value)
  return (
    <>
      <div class="surface rounded">
        <label class="sr-only"
          for="amount"
        >Amount</label>
        <input
          id="amount"
          name="amount"
          type="number"
          class="w-full h-16 text-xl text-center rounded-xl"
          classList={{
            "text-negative": props.colors && amount() < 0,
            "text-positive": props.colors && amount() >= 0,
          }}
          step="0.01"
          onChange={e => setAmount(parseFloat(e.currentTarget.value))}
          value={amount()}
          min={props.min}
          max={Number.MAX_VALUE}
        />
      </div>
    </>
  )
}

function FieldDate(props: VoidProps<{ value: string }>) {
  return (
    <>
      <label
        for="date"
        class="flex items-center h-full px-6 "
      >
        Date
      </label>
      <input
        id="date"
        type="date"
        name="date"
        required
        placeholder="Pick Date"
        class="h-12 px-4 bg-transparent w-full"
        value={props.value}
      />
    </>
  )
}

function FieldCategory(props: VoidProps<{ categories: Category[], value: string }>) {
  return (
    <>
      <label
        for="category"
        class="flex items-center h-full px-6 "
      >Category</label>
      <select
        id="category"
        name="category"
        class="h-12 px-4 bg-transparent w-full"
      >
        <For each={props.categories}>
          {category => (
            <option value={category.id}
              selected={category.id == props.value}
            >
              {`${category.icon} ${category.name}`}
            </option>
          )}
        </For>
      </select>
    </>
  )
}

function FieldName(props: VoidProps<{ value: string, label: string, placeholder?: string, required?: boolean }>) {
  return (
    <>
      <label for="name"
        class="flex items-center h-full px-6"
      >{props.label}</label>
      <input
        id="name"
        name="name"
        required={props.required}
        placeholder={props.placeholder}
        class="h-12 px-4 bg-transparent rounded-tr-xl w-full"
        value={props.value}
      />
    </>
  )
}
