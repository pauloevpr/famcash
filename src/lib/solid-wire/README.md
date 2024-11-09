# Solid Wire

Solid Wire is a native SolidJS library for building local-first apps with SolidJS and SolidStart. Unlike many of the alternative local-first libraries out there, Solid Wire is designed and built from the ground up specifically to work with SolidJS and SolidStart, which allows it to take full advantage of powerful primitives such as `createAsync` and server functions (with `use server`).

Solid Wire stores the data locally in the browser using `indexed-db`. This allows apps to provide a great user experience by displaying the data instantaneously with super fast navigations and interactions. It also helps reduce hosting costs, as most of the reads happen locally and don't require making API calls to the server. 

The data stored in the brower is synced with the server/database using a simple and powerful sync mechanism called `push-pull`. Unlike other sync mechanisms that require different API endpoints for pulling and pushing, `push-pull` uses a single API endpoint. When syncing, the client calls the `push-pull` API endpoint, it sends all the pending local writes to server, and it receives back any new updates from other clients.

When paired with the `createAsync` primitive from Solid, the Solid Wire stores also become reactive. Changes made to the data are reflected in the UI automatically without any extra steps, much like Solid's built-in stores.

## Getting Started

### Installation and Setup

Solid Wire is designed to work with SolidStart apps. To create a new SolidStart app, checkout the official [Getting Started](https://docs.solidjs.com/solid-start/getting-started) for SolidStart.

Once you have your SolidStart app in place, the first step is to disable SSR as we will be building a local-fisrt app. Edit your app.config.ts file and set `ssr` to `false`:

```ts
import { defineConfig } from "@solidjs/start/config";

export default defineConfig({
	ssr: false,
});
```

This configuration will turn your SolidStart app into an SPA (Single Page Application), which is the ideal architecture for building local-first apps. For more infomation on configuring SolidStart, check out the [official docs](https://docs.solidjs.com/solid-start/reference/config/define-config).

> **Note:** If you need to build an app that uses both SSR and local-first, you will need to break it down into two separate apps. SolidStart does not offer support for different rendering modes per route, and Solid Wire only works in non-SSR mode.

Add Solid Wire to your project:

```sh
npm install solid-wire
```

### Create your first Wire Store

Solid Wire uses the concept of Wire Store for working with your data. A Wire Store is a data store that "wires" the data that is locally stored in the browser with the data that is stored on your server/database.

Let's start by a creating a new store using the `createWireStore` function. In this example, we are creating a store for a simple Todo app:

```ts
import { createWireStore } from "./solid-wire";

export const store = createWireStore({
    name: "todo-app",
})
```

### Define the data structure

Now we need to define which type of data we are going to store. Solid Wire allows to add one or more data types by passing the `definition` parameter. For now let's add a single type: `Todo`:


```ts
import { createWireStore } from "./solid-wire";

type Todo = { title: string, done: boolean }

export const store = createWireStore({
    name: "todo-app",
    definition: {
        todo: {} as Todo
    },
})
```

> The typecast `as Todo` in the definition allows Solid Wire to know which typescript type to use when providing code completion for todos.


### Add the store to your app

Now that we have the basic store setup in place, let's add the store to our app so it becomes accessible. Solid Wire uses the popular Provide/Use pattern to make the store available in your components tree. We start by "providing" the store somewhere up in the tree. For this example, let't provide the store only on a particular page (`src/routes/todo.tsx`):

```ts
import { createWireStore } from "~/lib/solid-wire"

type Todo = { title: string, done: boolean }

const store = createWireStore({
  name: "todo-app",
  definition: {
    todo: {} as Todo
  },
})

export default function TodoPage() {
  return (
    <store.Provider>
        {/* nothing here yet */}
    </store.Provider>
  )
}
```

With the store provided in the components tree, we can access it from our components using `store.use()`:

```ts
import { createWireStore } from "~/lib/solid-wire"

type Todo = { title: string, done: boolean }

const store = createWireStore({
  name: "todo-app",
  definition: {
    todo: {} as Todo
  },
})

export default function TodoPage() {
  return (
    <store.Provider>
      <TodoList />
    </store.Provider>
  )
}

function TodoList() {
  let local = store.use()
  return (
    <ul>
    </ul>
  )
}
```

### Reading data from the store

Once we have the store in place in the component, we can retrieve all todos using the built-in function `store.todo.all()`. Because this is an asnyc function, we are going to wrap it using Solid Router's `createAsync` helper so we can wait until the data is loaded before we can render the list of todos:

```ts
import { createAsync } from "@solidjs/router"
import { For } from "solid-js"
import { createWireStore } from "~/lib/solid-wire"

type Todo = { title: string, done: boolean }

const store = createWireStore({
  name: "todo-app",
  definition: {
    todo: {} as Todo
  },
})


export default function TodoPage() {
  return (
    <store.Provider>
      <TodoList />
    </store.Provider>
  )
}

function TodoList() {
  let local = store.use()
  let todos = createAsync(() => local.todo.all(), { initialValue: [] })
  return (
    <ul>
      <For each={todos()}>
        {todo => (
          <li>{todo.title}</li>
        )}
      </For>
    </ul>
  )
}
```

> Notice how we use an empty array as `initialValue` to avoid the `todos` variable from being potentially `undefined`. Without that setting, you might need to wrap the list in either a `<Suspense>` or `<Show>` component in order to allow waiting for the data to be available.


### Writing to the store

So far we have been able to access our store and read data from it. Now it's time to deal with updating the data in the store. Let's start by creating a form that we can use to add new todos:

```ts
/* store setup ommited */

function TodoList() {
  let local = store.use()
  let todos = createAsync(() => local.todo.all(), { initialValue: [] })
  return (
    <div>
      <ul>
        <For each={todos()}>
          {todo => (
            <li>{todo.title}</li>
          )}
        </For>
      </ul>
      <form>
        <label for="title">New</label>
        <input id="title" name="title" required placeholder="New Todo" />
        <button>
          Add Todo
        </button>
      </form>
    </div>
  )
}
```




