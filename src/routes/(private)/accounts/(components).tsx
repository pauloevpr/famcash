import { useNavigate } from "@solidjs/router"
import { For, Show, VoidProps } from "solid-js"
import { Button } from "~/components/buttons"
import { Account } from "~/lib/models"

export function AccountForm(props: VoidProps<{
  account: Account,
  onSubmit: (account: Account) => void,
  onDelete?: (id: string) => void
}>
) {
  let navigate = useNavigate()
  let icons = [
    "💰",
    "🛒",
    "🏠",
    "💡",
    "🚗",
    "🎬",
    "🍽️",
    "💊",
    "📚",
    "🛍️",
    "💰",
    "🎮",
    "💪",
  ]

  function onSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let account: Account = {
      id: props.account.id,
      name: data.get("name") as string,
      icon: data.get("icon") as string,
    }
    props.onSubmit(account)
  }

  return (
    <main class="max-w-2xl mx-auto">
      <h1 class="block px-6 py-12 font-medium text-2xl text-center">Account</h1>
      <form method="post"
        class="px-1 text-lg space-y-10"
        onSubmit={onSubmit}
      >
        <div class="grid grid-cols-[auto,1fr] bg-white rounded-xl border border-gray-200">
          <label for="name" class="flex items-center h-full px-6">
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            placeholder="Enter name"
            class="h-12 px-4 rounded-tr-xl w-full"
            value={props.account.name}
          />
          <label for="icon" class="flex items-center h-full px-6 border-t border-gray-200">Icon</label>
          <select class="h-12 px-4 border-t border-gray-200 rounded-br-xl bg-transparent w-full"
            id="icon"
            name="icon">
            <For each={icons}>
              {icon => (
                <option value={icon}
                  selected={props.account.icon === icon}
                >{icon}</option>
              )}
            </For>
          </select>
        </div>
        <div class="flex items-center flex-col gap-2">
          <Button label="Save Account"
            style="primary"
          />
          <Show when={props.onDelete}>
            {(onDelete) => (
              <div class="w-full pb-4">
                <Button label="Delete"
                  type="button"
                  style="neutral"
                  onclick={() => onDelete()(props.account.id)}
                />
              </div>
            )}
          </Show>
          <Button label="Cancel"
            style="neutral"
            type="button"
            onClick={() => navigate(-1)}
          />
        </div>
      </form>
    </main>

  )
}
