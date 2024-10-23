import { A, createAsync, RouteDefinition } from "@solidjs/router";
import { For, Show } from "solid-js";
import { HomeIcon, TagIcon, WalletIcon } from "~/components/icons";
import { PageLayout } from "~/components/layouts";
import { getUser } from "~/lib/client";



export default function MenuPage() {
  let user = createAsync(() => getUser())
  let links = [
    { title: "Home", href: "/", icon: HomeIcon },
    { title: "Categories", href: "/categories", icon: TagIcon },
    { title: "Accounts", href: "/accounts", icon: WalletIcon },
  ]

  function getInitials(name: string) {
    if (!name) return "??"
    let parts = name.split(" ")
    return `${parts[0][0]}${parts[1]?.[0] || ""}`.toUpperCase()
  }

  return (
    <Show when={user()}>
      {user => (
        <PageLayout>
          <main>
            <section class="py-8 px-6">
              <header class="sr-only">Profile</header>
              <div class="flex items-center flex-col gap-4">
                <p class="bg-slate-200 uppercase inline-flex items-center justify-center rounded-full text-2xl text-primary w-16 h-16 p-2">
                  {getInitials(user().name)}
                </p>
                <p class="font-medium text-2xl text-center">{user().name}</p>
              </div>
            </section>
            <section class="px-1">
              <nav>
                <ul class="bg-white rounded-xl border border-gray-200">
                  <For each={links}>
                    {(link, index) => (
                      <li>
                        <A href={link.href}
                          class="flex items-center gap-6 text-lg px-6 h-16 hover:bg-gradient-to-r hover:to-white hover:from-slate-50 hover:via-primary-50"
                          classList={{
                            "border-t border-gray-200": index() > 0,
                          }}
                          replace
                        >
                          <link.icon class="flex-shrink-0 w-8 h-8 text-gray-400" />
                          <span>{link.title}</span>
                        </A>
                      </li>
                    )}
                  </For>
                </ul>
              </nav>
            </section>
          </main>
        </PageLayout>
      )}
    </Show>
  )
}
