
import { Account } from "~/lib/models";
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

  return (
    <Show when={account()}>
      {account => (
        <AccountForm account={account()}
          onSubmit={onSubmit}
        />
      )}
    </Show>
  )
}
