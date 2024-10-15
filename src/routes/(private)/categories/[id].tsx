import { Category } from "~/lib/models";
import { CategoryForm } from "./(components)";
import { idb } from "~/lib/idb";
import { useNavigate, useParams } from "@solidjs/router";
import { Show, createResource } from "solid-js";

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

  return (
    <Show when={category()}>
      {category => (
        <CategoryForm category={category()}
          onSubmit={onSubmit} />
      )}
    </Show>
  )
}
