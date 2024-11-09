
import { createAsync, useNavigate, useSearchParams } from "@solidjs/router";
import { DateOnly, generateDbRecordId } from "~/lib/utils";
import { Transaction, TransactionWithRefs } from "~/lib/models";
import { TransactionForm } from "./(components)";
import { Show } from "solid-js";
import { store } from "~/lib/wstore";


export default function TransactionCreatePage() {
  let local = store.use()
  let navigate = useNavigate()
  let [searchParams] = useSearchParams()
  let data = createAsync(async () => {
    let dateRaw = new Date()
    if (searchParams.month && searchParams.year) {
      dateRaw.setFullYear(parseInt(searchParams.year as string))
      dateRaw.setMonth(parseInt(searchParams.month as string) - 1, 1)
    }
    let date = new DateOnly(dateRaw)
    let categories = await local.categories.all()
    let transaction: TransactionWithRefs = {
      name: "",
      type: "expense",
      id: generateDbRecordId(),
      categoryId: categories[0]?.id,
      category: categories[0],
      amount: 0,
      yearMonthIndex: date.toYearMonthString(),
      date: date.toString(),
    }
    return {
      transaction,
      categories,
    }
  })
  async function onSubmit(transaction: Transaction) {
    await local.transactions.set(transaction)
    navigate(-1)
  }
  return (
    <Show when={data()}>
      {data => (
        <TransactionForm transaction={data().transaction}
          categories={data().categories}
          onSubmit={onSubmit}
        />
      )}
    </Show>
  )
}
