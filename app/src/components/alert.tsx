import { createMemo, Show, VoidProps } from "solid-js";


export default function Alert(props: VoidProps<{
  when: boolean,
  class?: string,
  error?: string,
  info?: string
}>) {
  let message = createMemo(() => props.error || props.info || "")
  return (
    <Show when={props.when}>
      <p class="rounded-xl px-6 py-4"
        classList={{
          "text-error bg-error-100": !!props.error,
          "text-primary bg-primary-100": !!props.info,
          [props.class || ""]: true
        }}
      >
        {message()}
      </p>
    </Show >
  )
}
