import { action, useSearchParams } from "@solidjs/router"
import { createSignal, Show } from "solid-js"
import { Button, LinkButton } from "~/components/buttons"
import { GoogleIcon } from "~/components/icons"
import { loginWithEmail, } from "~/lib/server"


export default function LoginPage() {
  let [params] = useSearchParams()
  let [state, setState] = createSignal({
    sent: false,
    email: ""
  })

  let loginAction = action(async (data: FormData) => {
    let email = data.get("email") as string
    await loginWithEmail(email)
    setState({ sent: true, email })
  })

  function clear() {
    setState({ sent: false, email: "" })
  }

  return (
    <main class="sm:px-6 py-24">
      <div class="relative mx-auto surface shadow-xl rounded-2xl px-6 sm:px-10 pb-12 pt-6 max-w-md">
        <div class="flex justify-center pb-10">
          <img class="h-20 w-20"
            alt="Logo"
            src="/logo.svg" />
        </div>
        <Show when={!state().sent}>
          <h1 class="sr-only text-2xl font-semibold pb-8">Sign In</h1>
          <form action={loginAction} method="post">
            <label for="email"
              class="block pb-2 text-light">Email</label>
            <input name="email"
              id="email"
              type="email"
              class="block border h-12 px-4 w-full rounded-lg mb-6"
              value={params.email || ""}
              required />
            <Button style="primary"
              label="Continue with email"
            />
          </form>
          <div class="flex items-center gap-4 py-8">
            <div class="h-0.5 bg-gray-100 flex-grow" />
            <span class="text-light">OR</span>
            <div class="h-0.5 bg-gray-100 flex-grow" />
          </div>
          <LinkButton style="neutral"
            label="Continue with Google"
            href="/api/auth/google"
            target="_self"
            icon={<GoogleIcon class="w-6 h-6" />}
          />
        </Show>
        <Show when={state().sent}>
          <h1 class="text-2xl font-semibold pb-4">Check your email</h1>
          <p class="text-light block pb-10">
            We have sent a login link to <b class="text-default font-semibold">{state().email}</b>. If you don't receive the email in a few seconds, it is good idea to check your spam folder.
          </p>
          <Button style="neutral"
            label="Close"
            onClick={clear}
          />
        </Show>
      </div>
    </main>
  )
}

