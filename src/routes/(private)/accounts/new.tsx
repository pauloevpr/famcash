import { idb } from "~/lib/idb"
import { Account } from "~/lib/models"
import { useNavigate } from "@solidjs/router"
import { AccountForm } from "./(components)"

export default function AccountCreatePage() {
  let navigate = useNavigate()
  let newAccount: Account = {
    id: new Date().getTime().toString(),
    name: "",
    icon: ""
  }

  function onSubmit(account: Account) {
    idb.set("accounts", account)
    navigate(-1)
  }

  return (
    <AccountForm account={newAccount}
      onSubmit={onSubmit}
    />
  )
}
