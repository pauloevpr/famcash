
import { Account, Transaction } from "~/lib/models";
import { idb } from "~/lib/idb";
import { useNavigate, useParams } from "@solidjs/router";
import { Show, createResource } from "solid-js";
import { AccountForm } from "./(components)";

export default function AccountEditPage() {
  let params = useParams()
  let navigate = useNavigate()
  let [account] = createResource(() => params.id, async (id) => {
    let account = await idb.get<Account>("accounts", id)
    if (!account) throw Error(`Account ${id} not found`)
    return account
  })

  function onSubmit(account: Account) {
    idb.set("accounts", account)
    navigate(-1)
  }

  async function onDelete(id: string) {
    let used = 0
    let transactions = await idb.getAll<Transaction>("transactions")
    let recurrencies = await idb.getAll<Transaction>("recurrencies")
    for (let transaction of transactions) {
      if (transaction.accountId === id) {
        used++
      }
    }
    for (let recurrency of recurrencies) {
      if (recurrency.accountId === id) {
        used++
      }
    }
    if (used > 0) {
      alert(`This account cannot be deleted becaused it is used in ${used} transactions.`)
      return
    }

    let confirmed = confirm("You are about to delete this account. Confirm?")
    if (!confirmed) return

    idb.delete("accounts", id)
    navigate(-1)
  }

  return (
    <Show when={account()}>
      {account => (
        <AccountForm account={account()}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      )}
    </Show>
  )
}
