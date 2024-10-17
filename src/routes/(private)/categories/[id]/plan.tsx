import { useNavigate, useParams } from "@solidjs/router"
import { createResource, createSignal, Show } from "solid-js"
import { Button } from "~/components/buttons"
import { idb } from "~/lib/idb"
import { Category } from "~/lib/models"


export default function CategoryPlanEditPage() {
  let navigate = useNavigate()
  let params = useParams()
  let [category, { mutate }] = createResource(() => params.id, async (id) => {
    let category = await idb.get<Category>("categories", id)
    if (!category) throw Error(`Category ${id} not found`)
    return category
  })

  function enablePlan(category: Category) {
    category = JSON.parse(JSON.stringify(category)) as Category
    category.plan = {
      limit: 0
    }
    mutate(category)
  }

  function save(category: Category, e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let amount = parseInt(data.get("amount") as string)
    category = JSON.parse(JSON.stringify(category)) as Category
    if (isNaN(amount)) {
      category.plan = undefined
    } else {
      category.plan = {
        limit: amount
      }
    }
    idb.set("categories", category)
    navigate(-1)
  }

  return (
    <Show when={category()}>
      {category => (
        <main class="px-1 max-w-2xl mx-auto">
          <header class="py-12 space-y-2">
            <span class="flex items-center justify-center mx-auto text-2xl w-16 h-16 bg-gray-200 rounded-full">{category().icon}</span>
            <h1 class="block px-6 font-medium text-2xl text-center">{category().name}</h1>
            <p class="text-light text-center">Spending Category</p>
          </header>
          <section >
            <div class="bg-white rounded-xl border border-gray-200">
              <h1 class="block px-6 py-4 text-xl font-medium">Spending Plan</h1>
              <div class="border-t border-gray-200 px-6 py-4">
                <p class="text-light">The spending plan lets you set how much you'd like to allocate towards this category every month. It gives you the freedom to spend guilty-free up to the amount you define, and it helps you stay on track.</p>
                <Show when={!category().plan}>
                  <div class="pt-6">
                    <Button style="primary"
                      label="Set Amount"
                      onClick={() => enablePlan(category())}
                    />
                  </div>
                </Show>
                <Show when={category().plan}>
                  {plan => (
                    <form id="form"
                      onSubmit={(e) => save(category(), e)}
                      class="pt-8">
                      <label for="amount"
                        class="font-medium block pb-4">How much would you like to spend?</label>
                      <input
                        id="amount"
                        name="amount"
                        class="h-16 bg-gray-100 rounded-lg border border-gray-200 px-6 text-center text-xl w-full"
                        type="number"
                        min="0"
                        step="0.01"
                        value={plan().limit}
                      />
                    </form>
                  )}
                </Show>
              </div>
            </div>
            <div class="pt-12">
              <Show when={category().plan}>
                <Button style="primary"
                  label="Save Plan"
                  form="form"
                />
              </Show>
              <div class="pt-4">
                <Button style="neutral"
                  label="Cancel"
                  onClick={() => navigate(-1)}
                />
              </div>
            </div>
          </section>
        </main >
      )
      }
    </Show >
  )
}