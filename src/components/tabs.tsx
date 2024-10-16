import { Accessor, createMemo, createSignal, For, ParentProps } from "solid-js"


export function useTabs(
  label: string,
  tabs: Accessor<{ label: string, key: string }[]>,
  options?: {
    key?: string
    initialSelection?: string
  }
) {
  let id = createMemo(() => {
    return options?.key || new Date().getTime().toString()
  })
  let [selected, setSelected] = createSignal(options?.initialSelection || tabs()[0]?.key || "")


  function Tab(props: ParentProps<{}>) {
    return (
      <div
        role="tablist" aria-label={label}>
        <div
          class="flex gap-2 pb-8"
        >
          <For each={tabs()}>{(item) => (
            <button type="button"
              aria-selected={selected() === item.key}
              id={`tab-${id()}-${item.key}`}
              aria-controls={`tabpanel-${id()}-${item.key}`}
              onClick={() => setSelected(item.key)}
              class="flex items-center peer-focus:outline text-lg rounded-full cursor-pointer px-4 h-12"
              classList={{
                "text-light": selected() !== item.key,
                "bg-gray-200 text-default font-medium": selected() === item.key,
              }}
            >
              {item.label}
            </button>
          )}</For>
        </div>
        {props.children}
      </div>
    )
  }

  function TabPanel(props: ParentProps<{ key: string }>) {
    return (
      <div class={selected() === props.key ? "contents" : "hidden"}
        id={`tabpanel-${id()}-${props.key}`}
        role="tabpanel"
        tabindex="0"
        aria-labelledby={`tab-${id()}-${props.key}`}
      >
        {props.children}
      </div>
    )
  }

  return { Tab, TabPanel, selected }
}
