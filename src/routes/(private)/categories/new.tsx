import { idb } from "~/lib/idb"
import { Category } from "~/lib/models"
import { CategoryForm } from "./(components)"
import { useNavigate } from "@solidjs/router"
import { generateDbRecordId } from "~/lib/utils"

export default function CategoryCreatePage() {
  let navigate = useNavigate()
  let newCategory: Category = {
    id: generateDbRecordId(),
    name: "",
    icon: ""
  }

  function onSubmit(category: Category) {
    idb.set("categories", category)
    navigate(-1)
  }

  return (
    <CategoryForm category={newCategory}
      onSubmit={onSubmit}
    />
  )
}

