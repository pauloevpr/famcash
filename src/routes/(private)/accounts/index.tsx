
import { For, VoidProps, createResource, useContext } from "solid-js";
import { AppContext } from "~/components/context";
import { WalletIcon } from "~/components/icons";
import { PageLayout } from "~/components/layouts";
import { Category as Account } from "~/lib/models";


export default function AccountsListPage() {
  let { store } = useContext(AppContext)
  let [accounts] = createResource(async () => {
    return await store.account.getAll()
  }, { initialValue: [] })
  return (
    <PageLayout>
      <main class="px-4 pb-32">
        <section class="py-8 px-6">
          <header class="sr-only">Categories</header>
          <div class="flex items-center flex-col gap-4">
            <p class="bg-slate-200 uppercase inline-flex items-center justify-center rounded-full text-2xl text-primary w-16 h-16 p-2">
              <WalletIcon class="flex-shrink-0 w-10 h-10" />
            </p>
            <p class="text-2xl text-center font-medium">Accounts</p>
          </div>
        </section>
        <ul class="space-y-1.5">
          <For each={accounts()}>
            {account => (
              <AccountListItem account={account} />
            )}
          </For>
        </ul>
        <div class="pt-8">
          <a href="/accounts/new" class="flex items-center justify-center w-full h-12 text-base font-semibold px-6 rounded-full uppercase tracking-wider bg-primary text-white">
            Add Account</a>
        </div>
      </main>
    </PageLayout>
  )
}

function AccountListItem(props: VoidProps<{ account: Account }>) {
  return (
    <li>
      <a href={`/accounts/${props.account.id}`}
        class="flex items-center gap-4 bg-white rounded-lg shadow-lg px-6 py-4">
        <span class="bg-gray-100 w-10 h-10 p-1 rounded-full flex items-center justify-center"
          aria-hidden>
          {props.account.icon}
        </span>
        <span class="block flex-grow">
          <p class="text-lg">
            {props.account.name}
          </p>
        </span>
      </a>
    </li>
  )
}
