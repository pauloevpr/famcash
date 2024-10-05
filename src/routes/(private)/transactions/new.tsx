
import { useNavigate, useSearchParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";
import { idb } from "~/lib/idb";
import { DateOnly } from "~/lib/utils";
import { Account, Category, Transaction, TransactionWithRefs } from "~/lib/models";
import { TransactionForm } from "./(components)";

export default function TransactionCreatePage() {
  let navigate = useNavigate()
  let [searchParams] = useSearchParams()
  let [data] = createResource(async () => {
    let dateRaw = new Date()
    if (searchParams.month && searchParams.year) {
      dateRaw.setFullYear(parseInt(searchParams.year))
      dateRaw.setMonth(parseInt(searchParams.month) - 1, 1)
    }
    let date = new DateOnly(dateRaw)
    let accounts = await idb.getAll<Account>("accounts")
    let categories = await idb.getAll<Category>("categories")
    let transaction: TransactionWithRefs = {
      name: "",
      type: "expense",
      id: new Date().getTime().toString(),
      accountId: accounts[0]?.id,
      account: accounts[0],
      categoryId: categories[0]?.id,
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
    await idb.saveTransaction(transaction)
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
