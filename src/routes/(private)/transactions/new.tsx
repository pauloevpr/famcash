
import { useNavigate, useSearchParams } from "@solidjs/router";
import { useContext } from "solid-js";
import { DateOnly, generateDbRecordId } from "~/lib/utils";
import { Transaction, TransactionWithRefs } from "~/lib/models";
import { TransactionForm } from "./(components)";
import { AppContext } from "~/components/context";


export default function TransactionCreatePage() {
  let { store } = useContext(AppContext)
  let navigate = useNavigate()
  let [searchParams] = useSearchParams()
  let data = (() => {
    let dateRaw = new Date()
    if (searchParams.month && searchParams.year) {
      dateRaw.setFullYear(parseInt(searchParams.year as string))
      dateRaw.setMonth(parseInt(searchParams.month as string) - 1, 1)
    }
    let date = new DateOnly(dateRaw)
    let categories = store.category.getAll()
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
  })()
  async function onSubmit(transaction: Transaction) {
    await store.transaction.save(transaction)
    navigate(-1)
  }
  return (
    <TransactionForm transaction={data.transaction}
      categories={data.categories}
      onSubmit={onSubmit}
    />
  )
}
