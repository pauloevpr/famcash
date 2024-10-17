import { Category, Transaction } from "~/lib/models";
import { idb } from "~/lib/idb";
import { useNavigate, useParams } from "@solidjs/router";
import { Show, createResource } from "solid-js";
import { CategoryForm } from "../(components)";

export default function CategoryEditPage() {
  let params = useParams()
  let navigate = useNavigate()
  let [category] = createResource(() => params.id, async (id) => {
    let category = await idb.get<Category>("categories", id)
    if (!category) throw Error(`Category ${id} not found`)
    return category
  })

  function onSubmit(category: Category) {
    idb.set("categories", category)
    navigate(-1)
  }

  async function onDelete(id: string) {
    let used = 0
    let transactions = await idb.getAll<Transaction>("transactions")
    let recurrencies = await idb.getAll<Transaction>("recurrencies")
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

    idb.delete("categories", id)
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
