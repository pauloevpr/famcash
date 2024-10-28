import { Category } from "~/lib/models"
import { CategoryForm } from "./(components)"
import { useNavigate } from "@solidjs/router"
import { generateDbRecordId } from "~/lib/utils"
import { useContext } from "solid-js/types/server/reactive.js"
import { AppContext } from "~/components/context"

export default function CategoryCreatePage() {
  let { store } = useContext(AppContext)
  let navigate = useNavigate()
  let newCategory: Category = {
    id: generateDbRecordId(),
    name: "",
    icon: ""
  }

  function onSubmit(category: Category) {
    store.category.save(category)
    navigate(-1)
  }

  return (
    <CategoryForm category={newCategory}
      onSubmit={onSubmit}
    />
  )
}

