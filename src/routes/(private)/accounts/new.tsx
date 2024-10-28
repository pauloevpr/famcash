import { Account } from "~/lib/models"
import { useNavigate } from "@solidjs/router"
import { AccountForm } from "./(components)"
import { generateDbRecordId } from "~/lib/utils"
import { AppContext } from "~/components/context"
import { useContext } from "solid-js"

export default function AccountCreatePage() {
  let { store } = useContext(AppContext)
  let navigate = useNavigate()
  let newAccount: Account = {
    id: generateDbRecordId(),
    name: "",
    icon: ""
  }

  async function onSubmit(account: Account) {
    await store.account.save(account)
    navigate(-1)
  }

  return (
    <AccountForm account={newAccount}
      onSubmit={onSubmit}
    />
  )
}

