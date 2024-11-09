
import { For, Show, useContext } from "solid-js";
import { InitialsAvatar } from "~/components/avatar";
import { LinkButton } from "~/components/buttons";
import { AppContext } from "~/components/context";
import { HandHeartIcon, UsersIcon } from "~/components/icons";
import { PageLayout } from "~/components/layouts";


export default function FamilyPage() {
  let { family } = useContext(AppContext);
  return (
    <PageLayout>
      <main class="px-4 pb-32">
        <section class="py-8 px-6">
          <header class="sr-only">Family Details
          </header>
          <div class="flex items-center flex-col gap-4">
            <p class="bg-slate-200 uppercase inline-flex items-center justify-center rounded-full text-2xl text-primary w-16 h-16 p-2">
              <HandHeartIcon class="flex-shrink-0 flex-shrink-0 w-10 h-10" />
            </p>
            <p class="text-2xl text-center font-medium">
              {family.name}
            </p>
            <p class="block -mt-2 text-light">
              Family
            </p>
          </div>
        </section>
        <section class="pt-8">
          <header class="flex items-center gap-3 text-lg">
            Members
            <UsersIcon class="w-4 h-4 text-gray-400" />
          </header>
          <ul class="pt-4 pb-10 space-y-1">
            <For each={family.members}>
              {member => (
                <li class="flex items-center gap-4 surface rounded px-6 py-4">
                  <InitialsAvatar name={member.name} />
                  {member.name}
                  <Show when={member.admin}>
                    <span class="block bg-primary-50 text-primary font-medium text-xs px-2 py-1 rounded-full">
                      Admin
                    </span>
                  </Show>
                </li>
              )}
            </For>
          </ul>
          <Show when={family.admin}>
            <LinkButton style="primary"
              href="/family/invite"
              label="Invite member"
            />
          </Show>
        </section>
      </main >
    </PageLayout>
  )
}
