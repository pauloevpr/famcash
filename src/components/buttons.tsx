import { A, AnchorProps } from "@solidjs/router"
import { Accessor, createMemo, JSX, ParentProps, splitProps } from "solid-js"

type ButtonStyle = "primary" | "neutral" | "negative" | "positive"

function useButtonStyle(style: Accessor<ButtonStyle>) {
  const base = "flex items-center justify-center gap-2 w-full h-12 text-base font-semibold px-6 rounded-full uppercase tracking-wider"
  const classList = createMemo(() => ({
    "bg-primary text-white": style() === "primary",
    "bg-gray-200 text-default": style() === "neutral",
    "bg-positive text-white": style() === "positive",
    "bg-negative text-white": style() === "negative",

  }))
  return {
    base: (() => base) as Accessor<string>,
    classList,
  }
}


export function LinkButton(props: ParentProps<{
  label: string
  style: ButtonStyle
  icon?: JSX.Element
  href: string
} & AnchorProps>) {
  let [_, otherProps] = splitProps(props, ["style", "label", "icon", "class", "classList"])
  let { base, classList } = useButtonStyle(() => props.style)
  return (
    <A class={base()}
      classList={classList()}
      {...otherProps}
    >
      {props.icon}
      {props.label}
    </A>
  )
}

export function Button(props: ParentProps<{
  label: string
  style: ButtonStyle
  icon?: JSX.Element

} & JSX.IntrinsicElements["button"]>) {
  let [_, otherProps] = splitProps(props, ["style", "label", "icon", "class", "classList"])
  const { base, classList } = useButtonStyle(() => props.style)
  return (
    <button class={base()}
      classList={classList()}
      {...otherProps}
    >
      {props.icon}
      {props.label}
    </button>
  )
}

