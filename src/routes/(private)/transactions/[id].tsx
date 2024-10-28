import { useNavigate, useParams } from "@solidjs/router";
import { createMemo, Show, useContext } from "solid-js";
import { Transaction } from "~/lib/models";
import { TransactionForm } from "./(components)";
import { AppContext } from "~/components/context";

export default function TransactionEditPage() {
  let { store } = useContext(AppContext)
  let params = useParams()
  let navigate = useNavigate()
  let data = createMemo(() => {
    let transaction = store.transaction.get(params.id)
    let accounts = store.account.getAll()
    let categories = store.category.getAll()
    return {
      transaction,
      accounts,
      categories
    }
  })
  async function onSubmit(transaction: Transaction) {
    let parsedId = store.parseTransactionId(transaction.id)
    if (parsedId.recurrency) {
      let confirmed = confirm("You are about to edit this and all future occurrences. Confirm?")
      if (!confirmed) return
    }
    await store.transaction.save(transaction)
    navigate(-1)
  }
  async function onDelete(id: string) {
    let msg = "You are about to delete this transaction. Confirm?"
    let parsedId = store.parseTransactionId(id)
    if (parsedId.recurrency) {
      msg = "You are about to delete this and all future occurrences. Confirm?"
    }
    let confirmed = confirm(msg)
    if (!confirmed) return
    await store.transaction.delete(id)
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


