import { action, useSearchParams, useSubmission } from "@solidjs/router";
import { Show, createEffect, createResource } from "solid-js";
import Alert from "~/components/alert";
import { Button } from "~/components/buttons";
import TriangleAlertIcon, { HandHeartIcon } from "~/components/icons";
import { getInvite, joinFamily } from "~/lib/server";


export default function JoinFamilyPage() {
  let [params] = useSearchParams()
  let [invite] = createResource(() => params.code, async (code) => {
    if (!code) return
    return await getInvite(code)
  })
  let joinAction = action(async () => {
    if (!params.code) return
    return await joinFamily(params.code)
  })
  let joinSub = useSubmission(joinAction)

  return (
    <Show when={invite()}
      fallback={invite.loading ? undefined : <InviteNotFound />}>
      {invite => (
        <main class="px-4 mx-auto max-w-2xl pb-32 pt-32">
          <h1 class="text-2xl font-medium">
            Join Family
          </h1>
          <p class="text-light pt-2 pb-8" >
            You have been invited to join this family and manage finances together. This invite expires soon, and it can only be used once.
          </p>
          <div class="flex items-center flex-col gap-4 bg-white rounded-xl py-6 mb-8 px-6">
            <p class="bg-slate-200 uppercase inline-flex items-center justify-center rounded-full text-2xl text-primary w-16 h-16 p-2">
              <HandHeartIcon class="flex-shrink-0 flex-shrink-0 w-10 h-10" />
            </p>
            <p class="text-2xl text-center font-medium">
              {invite().familyName}
            </p>
            <p class="block -mt-2 text-light">
              Family
            </p>
          </div>
          <Alert when={joinSub.error}
            error={joinSub.error?.toString()}
            class="my-6"
          />
          <form action={joinAction}
            method="post">
            <Button style="primary"
              label="Join family"
              disabled={joinSub.pending}
            />
          </form>
        </main>
      )}
    </Show>
  )
}

function InviteNotFound() {
  return (
    <main class="px-4 mx-auto max-w-2xl pb-32 pt-32">
      <h1 class="text-2xl font-medium">
        Join Family
      </h1>
      <p class="text-light pt-2 pb-8" >
        You have been invited to join this family and manage finances together. This invite expires soon, and it can only be used once.
      </p>
      <div class="flex items-center flex-col gap-4 bg-white rounded-xl py-6 mb-8 px-6">
        <p class="bg-slate-200 uppercase inline-flex items-center justify-center rounded-full text-2xl text-primary w-16 h-16 p-2">
          <TriangleAlertIcon class="flex-shrink-0 flex-shrink-0 text-error w-10 h-10" />
        </p>
        <p class="text-xl text-center font-medium">
          Invite not found
        </p>
        <p class="block text-light">
          It seems the invite you are trying to use either does not exist or has expired.
        </p>
      </div>
    </main>
  )
}
