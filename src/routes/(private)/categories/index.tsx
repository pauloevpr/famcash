import { createAsync } from "@solidjs/router";
import { For, Show, useContext, VoidProps, } from "solid-js";
import { LinkButton } from "~/components/buttons";
import { AppContext } from "~/components/context";
import { TagIcon } from "~/components/icons";
import { PageLayout } from "~/components/layouts";
import { Category } from "~/lib/models";
import { store } from "~/lib/wstore";


export default function CategoryListPage() {
  let local = store.use()
  let categories = createAsync(() => local.categories.all(), { initialValue: [] })
  return (
    <PageLayout nav>
      <main class="pt-6">
        <section class="surface rounded py-8 px-6">
          <header class="sr-only">Categories</header>
          <div class="flex items-center flex-col gap-4">
            <p class="bg-slate-200 uppercase inline-flex items-center justify-center rounded-full text-2xl text-primary w-16 h-16 p-2">
              <TagIcon class="flex-shrink-0 w-10 h-10" />
            </p>
            <p class="text-2xl text-center font-medium">Categories</p>
          </div>
        </section>
        <ul class="space-y-1 pt-6 ">
          <For each={categories()}>
            {category => (
              <CategoryListItem category={category} />
            )}
          </For>
        </ul>
        <div class="pt-8">
          <LinkButton
            label="Add Category"
            style="primary"
            href="/categories/new" class="flex items-center justify-center w-full h-12 text-base font-semibold px-6 rounded-full uppercase tracking-wider bg-primary text-white">
            Add Category
          </LinkButton>
        </div>
      </main>
    </PageLayout >
  )
}

function CategoryListItem(props: VoidProps<{ category: Category }>) {
  let { formatter } = useContext(AppContext)
  return (
    <li>
      <a href={`/categories/${props.category.id}`}
        class="flex items-center gap-4 surface rounded px-6 py-4">
        <span class="bg-gray-100 w-10 h-10 p-1 rounded-full flex items-center justify-center"
          aria-hidden>
          {props.category.icon}
        </span>
        <span class="block flex-grow">
          <p class="text-lg">
            {props.category.name}
          </p>
        </span>
        <Show when={props.category.plan}
          fallback={
            <span class="rounded border px-2 text-light">Unplanned</span>
          }
        >
          {plan => (
            <span class="inline-flex gap-2 text-light">
              <span>Planned:</span>
              <span class="font-medium text-default">{formatter.currency(plan().limit)}</span>
            </span>
          )}
        </Show>
      </a></li>
  )
}
