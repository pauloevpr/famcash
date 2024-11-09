import { Category } from "~/lib/models"
import { CategoryForm } from "./(components)"
import { useNavigate } from "@solidjs/router"
import { generateDbRecordId } from "~/lib/utils"
import { store } from "~/lib/wstore"

export default function CategoryCreatePage() {
  let local = store.use()
  let navigate = useNavigate()
  let newCategory: Category = {
    id: generateDbRecordId(),
    name: "",
    icon: ""
  }

  async function onSubmit(category: Category) {
    await local.categories.set(category.id, category)
    navigate(-1)
  }

  return (
    <CategoryForm category={newCategory}
      onSubmit={onSubmit}
    />
  )
}

