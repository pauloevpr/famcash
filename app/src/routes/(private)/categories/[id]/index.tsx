import { Category } from "~/lib/models";
import { createAsync, useNavigate, useParams } from "@solidjs/router";
import { Show, } from "solid-js";
import { CategoryForm } from "../(components)";
import { store } from "~/lib/wstore";

export default function CategoryEditPage() {
  let local = store.use()
  let params = useParams()
  let navigate = useNavigate()
  let category = createAsync(async () => {
    let category = await local.categories.get(params.id)
    if (!category) throw Error(`Category ${params.id} not found`)
    return category
  })

  async function onSubmit(category: Category) {
    await local.categories.set(category.id, category)
    navigate(-1)
  }

  async function onDelete(id: string) {
    let used = 0
    let transactions = await local.transactions.all()
    let recurrencies = await local.recurrencies.all()
    for (let transaction of transactions) {
      if (transaction.categoryId === id) {
        used++
      }
    }
    for (let recurrency of recurrencies) {
      if (recurrency.categoryId === id) {
        used++
      }
    }
    if (used > 0) {
      alert(`This category cannot be deleted becaused it is used in ${used} transactions.`)
      return
    }

    let confirmed = confirm("You are about to delete this category. Confirm?")
    if (!confirmed) return
    await local.categories.delete(id)
    navigate(-1)
  }

  return (
    <Show when={category()}>
      {category => (
        <CategoryForm category={category()}
          onSubmit={onSubmit}
          onDelete={onDelete}
        />
      )}
    </Show>
  )
}
