import { A, action, } from "@solidjs/router";
import { For, useContext } from "solid-js";
import { InitialsAvatar } from "~/components/avatar";
import { AppContext } from "~/components/context";
import { HandHeartIcon, LogoutIcon, TagIcon, } from "~/components/icons";
import { PageLayout } from "~/components/layouts";
import { logout } from "~/lib/server";


export default function MenuPage() {
  let { user } = useContext(AppContext);
  let logoutAction = action(async () => {
    let confirmed = confirm("You are about to logout from this device. Confirm")
    if (!confirmed) return
    return await logout()
  })

  let links = [
    { title: "Categories", href: "/categories", icon: TagIcon },
    { title: "Family", href: "/family", icon: HandHeartIcon },
  ]

  return (
    <PageLayout nav>
      <main class="relative pb-24 pt-6">
        <section class="py-8 px-6">
          <header class="sr-only">Profile</header>
          <div class="flex items-center flex-col gap-4">
            <InitialsAvatar name={user.name}
              large
            />
            <p class="font-medium text-2xl text-center">{user.name}</p>
            <p class="text-light text-center -mt-3">{user.email}</p>
          </div>
        </section>
        <section class="pt-2">
          <nav>
            <ul class="surface rounded">
              <For each={links}>
                {(link, index) => (
                  <li>
                    <A href={link.href}
                      class="group flex items-center gap-6 text-lg px-6 h-16 hover:bg-gradient-to-r hover:to-white hover:via-slate-50 hover:from-primary-50"
                      classList={{
                        "border-t border-gray-200": index() > 0,
                        "rounded-t-xl": index() === 0,
                        "rounded-b-xl": index() === links.length - 1,
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
            <ul class="surface rounded mt-8">
              <li>
                <form action={logoutAction}
                  method="post">
                  <button class="flex items-center group rounded-xl gap-6 w-full text-lg px-8 h-16 hover:bg-gradient-to-r hover:from-white hover:via-slate-50 hover:to-primary-50"
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
