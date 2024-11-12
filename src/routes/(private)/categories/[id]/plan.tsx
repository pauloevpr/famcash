import { createAsync, useNavigate, useParams } from "@solidjs/router"
import { Show, } from "solid-js"
import { Button } from "~/components/buttons"
import { Category } from "~/lib/models"
import { SpendingPlanField } from "../(components)"
import { store } from "~/lib/wstore"


export default function PlanEditPage() {
  let local = store.use()
  let navigate = useNavigate()
  let params = useParams()
  let category = createAsync(async () => {
    let category = await local.categories.get(params.id)
    if (!category) throw Error(`Category ${params.id} not found`)
    return category
  })

  async function save(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let amount = parseInt(data.get("amount") as string)
    let update = JSON.parse(JSON.stringify(category())) as Category
    if (isNaN(amount)) {
      update.plan = undefined
    } else {
      update.plan = {
        limit: amount
      }
    }
    await local.categories.set(update.id, update)
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
          <section>
            <form id="form"
              onSubmit={(e) => save(e)}
            >
              <SpendingPlanField category={category()} />
            </form>
            <div class="pt-12">
              <Button style="primary"
                label="Save Plan"
                form="form"
              />
              <div class="pt-4">
                <Button style="neutral"
                  label="Cancel"
                  onClick={() => navigate(-1)}
                />
              </div>
            </div>
          </section>
        </main >
      )}
    </Show>
  )
}

