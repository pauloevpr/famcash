import { useNavigate, useParams } from "@solidjs/router";
import { createResource, Show } from "solid-js";
import { idb } from "~/lib/idb";
import { Account, Category, Transaction } from "~/lib/models";
import { TransactionForm } from "./(components)";

export default function TransactionEditPage() {
  let params = useParams()
  let navigate = useNavigate()
  let [data] = createResource(() => params.id, async (id) => {
    let transaction = await idb.getTransactionById(id)
    let accounts = await idb.getAll<Account>("accounts")
    let categories = await idb.getAll<Category>("categories")
    return {
      transaction,
      accounts,
      categories
    }
  })
  async function onSubmit(transaction: Transaction) {
    await idb.saveTransaction(transaction)
    navigate(-1)
  }
  async function onDelete(id: string) {
    let confirmed = confirm("You are about to delete this transaction. Confirm?")
    if (!confirmed) return
    await idb.delete("transactions", id)
    navigate(-1)
  }
  return (
    <Show when={data()}>
      {data => (
        <TransactionForm transaction={data().transaction}
          categories={data().categories}
          accounts={data().accounts}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      )}
    </Show>
  )
}

