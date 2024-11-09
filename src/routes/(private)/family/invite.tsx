import { action, useNavigate, useSubmission } from "@solidjs/router";
import { createMemo, createSignal, onCleanup, Show, useContext, VoidProps } from "solid-js";
import { Button } from "~/components/buttons";
import { AppContext } from "~/components/context";
import { HandHeartIcon, HoursGlassIcon, QRCodeIcon } from "~/components/icons";
import { QRCodeBar } from "~/components/qrcode";
import { createInvite } from "~/lib/server";

export default function InvitePage() {
  let navigate = useNavigate()
  let { family } = useContext(AppContext)
  let invite = action(() => {
    return createInvite(family.id)
  })
  let inviteResult = useSubmission(invite)

  if (!family.admin) {
    navigate("/family")
    return
  }
  // TODO: show "expired" msg when expiration timer is up

  return (
    <main class="px-4 mx-auto max-w-xl pb-32">
      <section class="py-8 px-6">
        <header class="sr-only">Categories
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
      <Show when={!inviteResult.result}>
        <section class="pt-8">
          <header class="text-2xl font-medium">
            Invite others to your family
          </header>
          <p class="text-light pt-2">
            Invite family members or trusted people to join your family and help manage your finances together. Click the button below to generate a QR code and share it with the other person.
          </p>
          <div class="py-10">
            <div class="flex items-center justify-center w-64 h-64 mx-auto rounded-xl border border-gray-300 text-light text-sm bg-gray-200 rounded-xl">
              <QRCodeIcon />
            </div>
          </div>
          <div>
            <form class="pb-6"
              action={invite} method="post">
              <Button style="primary"
                disabled={inviteResult.pending}
                label="Generate Invite"
                icon={<QRCodeIcon class="w-5 h-5" />}
              />
            </form>
            <Button style="neutral"
              label="Cancel"
              onClick={() => navigate(-1)}
            />
          </div>
        </section>
      </Show>
      <Show when={inviteResult.result}>
        {result => (
          <section class="pt-8">
            <header class="text-2xl font-medium">
              Invite others to your family
            </header>
            <p class="text-light pt-2">
              Invite family members or trusted people to join your family and help manage your finances together. Share the QR code below with the person you are inviting. The QR code can only be used once.
            </p>
            <div class="py-10">
              <div class="bg-white p-1 w-64 h-64 rounded-xl border border-gray-300 mx-auto shadow shadow-primary-200">
                <QRCodeBar text={result().code} />
              </div>
              <ExpirationTimer date={result().expired_at} />
            </div>
            <Button style="primary"
              label="Done"
              onClick={() => navigate(-1)}
            />
          </section>
        )}
      </Show>
    </main>
  )
}


function ExpirationTimer(props: VoidProps<{ date: Date | string }>) {
  let expiration = createMemo(() => new Date(props.date))
  let [display, setDisplay] = createSignal("")

  function updateDisplay() {
    let value = expiration().getTime() - new Date().getTime()
    if (value <= 0) {
      setDisplay("Expired")
    } else {
      let min = value / 1000 / 60
      setDisplay(`Expires in ${min.toFixed(0)} min`)
    }
  }

  updateDisplay()

  let interval = setInterval(updateDisplay, 1000)

  onCleanup(() => {
    clearInterval(interval)
  })

  return (
    <div class="flex items-center gap-2 bg-gradient-to-r  from-stone-200 to-stone-100 px-6 py-4  text-light rounded-xl mt-8 ">
      <HoursGlassIcon class="w-4 h-4 text-gray-400 animate-pulse" />
      <time dateTime={expiration().toISOString()}
        aria-label="invite code expiration">
        {display()}
      </time>
    </div>
  )
}
