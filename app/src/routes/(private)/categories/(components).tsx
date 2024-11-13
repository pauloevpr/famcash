import { useNavigate } from "@solidjs/router"
import { For, Show, VoidProps } from "solid-js"
import { Button } from "~/components/buttons"
import { LightBulbIcon } from "~/components/icons"
import { PageLayout } from "~/components/layouts"
import { Category } from "~/lib/models"

export function CategoryForm(props: VoidProps<{
  category: Category,
  onSubmit: (category: Category) => void,
  onDelete?: (id: string) => void,
  plan?: boolean
}>
) {
  let navigate = useNavigate()
  const icons = [
    { name: "Airplane", icon: "✈️" },
    { name: "Bank", icon: "🏦" },
    { name: "Beach with Umbrella", icon: "🏖️" },
    { name: "Bicycle", icon: "🚲" },
    { name: "Books", icon: "📚" },
    { name: "Car", icon: "🚗" },
    { name: "Chart Increasing", icon: "📈" },
    { name: "Chart with Yen Sign", icon: "💹" },
    { name: "Clapper Board", icon: "🎬" },
    { name: "Credit Card", icon: "💳" },
    { name: "Dollar Banknote", icon: "💵" },
    { name: "Droplet", icon: "💧" },
    { name: "Electric Plug", icon: "🔌" },
    { name: "Fork and Knife with Plate", icon: "🍽️" },
    { name: "Graduation Cap", icon: "🎓" },
    { name: "Gym", icon: "💪" },
    { name: "Hamburger", icon: "🍔" },
    { name: "Hospital", icon: "🏥" },
    { name: "House", icon: "🏠" },
    { name: "Light Bulb", icon: "💡" },
    { name: "Lotion Bottle", icon: "🧴" },
    { name: "Luggage", icon: "🧳" },
    { name: "Microphone", icon: "🎤" },
    { name: "Money Bag", icon: "💰" },
    { name: "Nail Polish", icon: "💅" },
    { name: "Office Building", icon: "🏢" },
    { name: "Pen", icon: "🖊️" },
    { name: "Pill", icon: "💊" },
    { name: "Red Apple", icon: "🍎" },
    { name: "Shopping Cart", icon: "🛒" },
    { name: "Shopping Bag", icon: "🛍️" },
    { name: "Stethoscope", icon: "🩺" },
    { name: "Sushi", icon: "🍣" },
    { name: "Video Game", icon: "🎮" },
    { name: "Woman Getting Haircut", icon: "💇" },
  ];

  function onSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let category: Category = {
      id: props.category.id,
      name: data.get("name") as string,
      icon: data.get("icon") as string,
    }
    let amount = parseInt(data.get("amount") as string)
    if (isNaN(amount)) {
      category.plan = undefined
    } else {
      category.plan = {
        limit: amount
      }
    }
    props.onSubmit(category)
  }

  return (
    <PageLayout>
      <main class="max-w-2xl mx-auto">
        <h1 class="block px-6 py-12 font-medium text-2xl text-center">Category</h1>
        <form method="post"
          action="/categories/new"
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
              value={props.category.name}
            />
            <label for="icon" class="flex items-center h-full px-6 border-t border-gray-200">Icon</label>
            <select class="h-12 px-4 border-t border-gray-200 rounded-br-xl bg-transparent w-full"
              id="icon"
              name="icon"
            >
              <For each={icons}>
                {icon => (
                  <option value={icon.icon}
                    selected={props.category.icon === icon.icon}
                  >{`${icon.icon}`}</option>
                )}
              </For>
            </select>
          </div>
          <SpendingPlanField category={props.category} />
          <div class="flex items-center flex-col gap-2">
            <Button label="Save Category"
              style="primary"
            />
            <Show when={props.onDelete}>
              {(onDelete) => (
                <div class="w-full pb-4">
                  <Button label="Delete"
                    type="button"
                    style="neutral"
                    onclick={() => onDelete()(props.category.id)}
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
    </PageLayout>
  )
}

export function SpendingPlanField(props: VoidProps<{ category: Category }>) {
  return (
    <section class="surface rounded">
      <header class="flex items-center gap-3 px-6 py-4 text-lg font-medium">
        <LightBulbIcon class="text-gray-400 w-5 h-5" />
        Spending Plan
      </header>
      <div class="border-t border-gray-200 px-6 py-4">
        <p class="text-light">The spending plan lets you set how much you'd like to allocate towards this category every month. It gives you the freedom to spend guilty-free up to the amount you define, and it helps you stay on track.</p>
        <div class="pt-8">
          <label for="amount"
            class="font-medium block pb-4">How much would you like to spend?</label>
          <input
            id="amount"
            name="amount"
            class="h-16 rounded-lg border border-gray-200 px-6 text-center text-xl w-full"
            type="number"
            min="0"
            step="0.01"
            value={props.category.plan?.limit}
          />
        </div>
      </div>
    </section>
  )
}
