import { revalidate, useNavigate } from "@solidjs/router";
import { Button } from "~/components/buttons";
import { updateUser } from "~/lib/server";

export default function WelcomePage() {
  let navigate = useNavigate()

  async function onSubmit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault()
    let data = new FormData(e.currentTarget)
    let name = data.get("name") as string
    await updateUser(name)
    revalidate("user")
    navigate("/")
  }

  return (
    <main class="px-6 py-24">
      <div class="relative mx-auto bg-white shadow-xl rounded-2xl px-10 pb-12 pt-6 max-w-md">
        <div class="flex justify-center pb-10">
          <img class="h-20 w-20"
            alt="Logo"
            src="/logo.svg" />
        </div>
        <h1 class="text-2xl font-semibold pb-8">Welcome</h1>
        <form onSubmit={onSubmit}>
          <label for="name"
            class="block pb-2 text-light">What is your name?</label>
          <input name="name"
            id="name"
            min="2"
            max="32"
            class="block border h-12 px-4 w-full rounded-lg mb-6"
            required />
          <Button style="primary"
            label="Continue"
          />
        </form>
      </div>
    </main>
  )
}
