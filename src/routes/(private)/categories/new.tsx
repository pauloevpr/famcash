import { idb } from "~/lib/idb"
import { Category } from "~/lib/models"
import { CategoryForm } from "./(components)"
import { useNavigate } from "@solidjs/router"

export default function CategoryCreatePage() {
  let navigate = useNavigate()
  let newCategory: Category = {
    id: new Date().getTime().toString(),
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

