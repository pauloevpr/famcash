import { createMemo, VoidProps } from "solid-js"



export function InitialsAvatar(props: VoidProps<{
  name?: string,
  class?: string,
  large?: boolean
}>) {
  let initials = createMemo(() => {
    if (!props.name) return "??"
    let parts = props.name.split(" ")
    return `${parts[0][0]}${parts[1]?.[0] || ""}`
  })
  let color = createMemo(() => {
    let first = (initials()[0] || "").toLowerCase()
    return colors[first] || "text-primary"
  })
  return (
    <span class={`${props.class || ""} ${color()} uppercase bg-slate-200 rounded-full flex items-center justify-center`}
      classList={{
        "text-2xl w-16 h-16 p-2": props.large,
        "w-10 h-10 p-1": !props.large,
      }}
      aria-hidden
    >
      {initials()}
    </span>
  )
}

const colors: { [key: string]: string } = {
  "a": "text-stone",
  "b": "text-red-600",
  "c": "text-orange-600",
  "d": "text-amber-600",
  "e": "text-yellow-600",
  "f": "text-lime-600",
  "g": "text-green-600",
  "h": "text-emerald-600",
  "i": "text-teal-600",
  "j": "text-cyan-600",
  "k": "text-sky-600",
  "l": "text-blue-600",
  "m": "text-indigo-600",
  "n": "text-violet-600",
  "o": "text-purple-600",
  "p": "text-fuchsia-600",
  "q": "text-pink-600",
  "r": "text-rose-600",
  "s": "text-red-600",
  "t": "text-orange-600",
  "u": "text-amber-600",
  "v": "text-cyan-600",
  "x": "text-indigo-600",
  "w": "text-pink-600",
  "y": "text-lime-600",
  "z": "text-fuchsia-600",
}
