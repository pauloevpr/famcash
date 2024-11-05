import { useNavigate, useParams } from "@solidjs/router"
import { useContext, } from "solid-js"
import { Button } from "~/components/buttons"
import { AppContext } from "~/components/context"
import { Category } from "~/lib/models"
import { SpendingPlanField } from "../(components)"


export default function CategoryPlanEditPage() {
  let { store } = useContext(AppContext)
  let navigate = useNavigate()
  let params = useParams()
  let category = (() => {
    let category = store.category.get(params.id)
    if (!category) throw Error(`Category ${params.id} not found`)
    return category
  })()

  async function save(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
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
    await store.category.save(category)
    navigate(-1)
  }

  return (
    <main class="px-1 max-w-2xl mx-auto">
      <header class="py-12 space-y-2">
        <span class="flex items-center justify-center mx-auto text-2xl w-16 h-16 bg-gray-200 rounded-full">{category.icon}</span>
        <h1 class="block px-6 font-medium text-2xl text-center">{category.name}</h1>
        <p class="text-light text-center">Spending Category</p>
      </header>
      <section>
        <form id="form"
          onSubmit={(e) => save(e)}
        >
          <SpendingPlanField category={category} />
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
  )
}

