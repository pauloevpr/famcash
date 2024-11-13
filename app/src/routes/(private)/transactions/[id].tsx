import { createAsync, useNavigate, useParams } from "@solidjs/router";
import { Transaction } from "~/lib/models";
import { TransactionForm } from "./(components)";
import { store } from "~/lib/wstore";
import { Show } from "solid-js";

export default function TransactionEditPage() {
  let local = store.use()
  let params = useParams()
  let navigate = useNavigate()
  let data = createAsync(async () => {
    let transaction = await local.transactions.get(params.id)
    if (!transaction) throw Error("transaction not found")
    let categories = await local.categories.all()
    return {
      transaction,
      categories
    }
  })

  async function onSubmit(transaction: Transaction) {
    let parsedId = local.parseTransactionId(transaction.id)
    if (parsedId.recurrency) {
      let confirmed = confirm("You are about to edit this and all future occurrences. Confirm?")
      if (!confirmed) return
    }
    await local.transactions.set(transaction)
    navigate(-1)
  }

  async function onDelete(id: string) {
    let msg = "You are about to delete this transaction. Confirm?"
    let parsedId = local.parseTransactionId(id)
    if (parsedId.recurrency) {
      msg = "You are about to delete this and all future occurrences. Confirm?"
    }
    let confirmed = confirm(msg)
    if (!confirmed) return
    await local.transactions.delete(id)
    navigate(-1)
  }

  return (
    <Show when={data()}>
      {data => (
        <TransactionForm transaction={data().transaction}
          categories={data().categories}
          onSubmit={onSubmit}
          onDelete={onDelete}
          type={data().transaction.type}
        />
      )}
    </Show>
  )
}


