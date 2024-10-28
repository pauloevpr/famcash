import { Category } from "~/lib/models";
import { useNavigate, useParams } from "@solidjs/router";
import { Show, createResource, useContext } from "solid-js";
import { CategoryForm } from "../(components)";
import { AppContext } from "~/components/context";

export default function CategoryEditPage() {
  let { store } = useContext(AppContext)
  let params = useParams()
  let navigate = useNavigate()
  let [category] = createResource(() => params.id, async (id) => {
    let category = await store.category.get(id)
    if (!category) throw Error(`Category ${id} not found`)
    return category
  })

  async function onSubmit(category: Category) {
    await store.category.save(category)
    navigate(-1)
  }

  async function onDelete(id: string) {
    let used = 0
    let transactions = await store.transaction.getAll()
    let recurrencies = await store.recurrency.getAll()
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
    await store.category.delete(id)
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
