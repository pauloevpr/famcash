import { VoidProps } from "solid-js"

type IconProps = VoidProps<{ class?: string }>

export function ChevronLeft(props: IconProps) {

  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class={defaultStyle(props)}
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  )
}

export function ChevronRight(props: IconProps) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class={defaultStyle(props)}
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  )
}

function defaultStyle(props: IconProps): string {
  let style = props.class || "w-8 h-8"
  return "flex-shrink-0 " + style
}
