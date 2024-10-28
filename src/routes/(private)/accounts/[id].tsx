
import { Account, } from "~/lib/models";
import { useNavigate, useParams } from "@solidjs/router";
import { Show, createResource, useContext } from "solid-js";
import { AccountForm } from "./(components)";
import { AppContext } from "~/components/context";

export default function AccountEditPage() {
  let { store } = useContext(AppContext)
  let params = useParams()
  let navigate = useNavigate()
  let [account] = createResource(() => params.id, async (id) => {
    let account = await store.account.get(id)
    if (!account) throw Error(`Account ${id} not found`)
    return account
  })

  async function onSubmit(account: Account) {
    await store.account.save(account)
    navigate(-1)
  }

  async function onDelete(id: string) {
    let used = 0
    let transactions = await store.transaction.getAll()
    let recurrencies = await store.recurrency.getAll()
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

    await store.account.delete(id)
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
