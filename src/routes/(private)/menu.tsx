import { A, action, } from "@solidjs/router";
import { For, useContext } from "solid-js";
import { AppContext } from "~/components/context";
import { HomeIcon, LogoutIcon, TagIcon, WalletIcon } from "~/components/icons";
import { PageLayout } from "~/components/layouts";
import { logout } from "~/lib/server";


export default function MenuPage() {
  let { user } = useContext(AppContext);
  let logoutAction = action(logout)

  let links = [
    { title: "Categories", href: "/categories", icon: TagIcon },
    { title: "Accounts", href: "/accounts", icon: WalletIcon },
  ]

  function getInitials(name: string) {
    if (!name) return "??"
    let parts = name.split(" ")
    return `${parts[0][0]}${parts[1]?.[0] || ""}`.toUpperCase()
  }

  return (
    <PageLayout>
      <main class="pb-24">
        <section class="py-8 px-6">
          <header class="sr-only">Profile</header>
          <div class="flex items-center flex-col gap-4">
            <p class="bg-slate-200 uppercase inline-flex items-center justify-center rounded-full text-2xl text-primary w-16 h-16 p-2">
              {getInitials(user.name)}
            </p>
            <p class="font-medium text-2xl text-center">{user.name}</p>
          </div>
        </section>
        <section class="px-1">
          <nav>
            <ul class="bg-white rounded-xl border border-gray-200">
              <For each={links}>
                {(link, index) => (
                  <li>
                    <A href={link.href}
                      class="group flex items-center gap-6 text-lg px-6 h-16 hover:bg-gradient-to-r hover:to-white hover:via-slate-50 hover:from-primary-50"
                      classList={{
                        "border-t border-gray-200": index() > 0,
                      }}
                      replace
                    >
                      <link.icon class="flex-shrink-0 w-8 h-8 text-gray-400 group-hover:text-primary" />
                      <span>{link.title}</span>
                    </A>
                  </li>
                )}
              </For>
            </ul>
            <ul class=" bg-white rounded-xl border border-gray-200 mt-8">
              <li>
                <form action={logoutAction}
                  method="post">
                  <button class="flex items-center group gap-6 w-full text-lg px-8 h-16 hover:bg-gradient-to-r hover:from-white hover:via-slate-50 hover:to-primary-50"
                  >
                    <span class="block text-left flex-grow">Logout</span>
                    <LogoutIcon class="flex-shrink-0 w-8 h-8 text-gray-400 group-hover:text-primary" />
                  </button>
                </form>
              </li>
            </ul>
          </nav>
        </section>
      </main>
    </PageLayout>
  )
}
