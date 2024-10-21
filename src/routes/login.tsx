import { A, useSearchParams } from "@solidjs/router"
import { createSignal, Show } from "solid-js"
import { Button } from "~/components/buttons"
import { loginWithEmail } from "~/lib/server"


// TODO: finish implementation

export default function LoginPage() {
  return (
    <main class="px-6 py-24">
      <div class="relative mx-auto bg-white shadow-xl rounded-2xl px-10 pb-12 pt-6 max-w-md">
        <div class="flex justify-center pb-10">
          <img class="h-20 w-20"
            alt="Logo"
            src="/logo.svg" />
        </div>
        <LoginForm />
      </div>
    </main>
  )
}

function LoginForm() {
  let [params] = useSearchParams()
  let [state, setState] = createSignal({
    sent: false,
    email: ""
  })

  async function onSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let email = data.get("email") as string
    setState({ sent: true, email })
    await loginWithEmail(email)
  }

  function clear() {
    setState({ sent: false, email: "" })
  }

  return (
    <>
      <Show when={!state().sent}>
        <h1 class="text-2xl font-semibold pb-8">Login</h1>
        <form onSubmit={onSubmit}>
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
    </>
  )
}

