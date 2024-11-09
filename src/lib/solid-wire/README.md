# Solid Wire

Solid Wire is a native SolidJS library for building local-first apps with SolidJS and SolidStart. Unlike many of the alternative local-first libraries out there, Solid Wire is designed and built from the ground up specifically to work with SolidJS and SolidStart, and to take full advantage of some powerful primitives such as `createAsync` and server functions (with `use server`).

## How it works

Solid Wire stores the data locally in the browser using `indexed-db`. The data is then synced with the server/database using a simple and powerful sync mechanism called `push-pull`. Unlike other sync mechanisms, `push-pull` uses a single API endpoint. When syncing, the client calls the `push-pull` API endpoint, sends all its pending local writes, and receives back any new updates.

Solid Wire handles all the syncing logic and indexed-db interfacing for you. What is left for you is to write the code that persists the data to your favorite database. 

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

### Creating a Wire Store

Solid Wire uses the concept of Wire Store for working with your data. A Wire Store is a data store that "wires" the data that is locally stored in the browser with the data that is stored on your server/database.

Let's start by a creating a new store using the `createWireStore` function. In this example, we are creating a store for a simple Todo app:

```ts
import { createWireStore } from "./solid-wire";

export const store = createWireStore({
    name: "todo-app",
})
```

### Defining the data structure

Now we need to define which type of data we are going to store. Solid Wire allows us to add one or more data types in the `definition` field. For now let's add a single type: `Todo`:


```jsx
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


### Registering the store

Solid Wire uses the popular [Provider/Use](https://docs.solidjs.com/concepts/context) pattern to make the store available in your components tree. We start by "providing" the store somewhere up in the tree. For this example, let't provide the store only on this particular todo page (`src/routes/todo.tsx`):

```jsx
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

With the store available in the components tree, we can access it from any components using `store.use()`. Let's add a new component to list our todos:

```jsx
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

### Reading data

With the store in place, we can retrieve all todos using `store.todo.all()`. Because this is an asnyc function, we are going to wrap it using Solid's `createAsync` helper so we can wait until the data is loaded before we can render the list of todos:

```jsx
/* store setup ommited */

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


  ### Writing data

#### Adding and updating

  Now let's deal with updating the data in our the store. Let's start by creating a form that we can use to add new todos:

  ```jsx
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

  Now let's handle the form submission and use `local.todo.set` to save our new todo:

  ```ts
  /* store setup ommited */

  function TodoList() {
    let local = store.use()
    let todos = createAsync(() => local.todo.all(), { initialValue: [] })

    async function onSubmit(e: SubmitEvent) {
      e.preventDefault()
      let data = new FormData(e.target as HTMLFormElement)
      let todo: Todo = {
        id: new Date().getTime().toString(),
        title: data.get("title") as string,
        done: false,
      }
      await local.todo.set(todo.id, todo)
    }

    return (
      <div>
        <ul>
          <For each={todos()}>
            {todo => (
              <li>{todo.title}</li>
            )}
          </For>
        </ul>
        <form onSubmit={onSubmit}>
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

> Notice how we are generating the `id` for the todo item in the client. This is a requirement for implement local-first apps.

Since our Solid Wire stores are reactive, the new todo should appear in the list automatically.

#### Deleting

Now let's handle deleting a todo. Let's add a delete button next to each todo. When the button is clicked, we are going to use `local.todo.delete` to remove the todo:

```jsx
/* store setup ommited */

function TodoList() {
  let local = store.use()
  let todos = createAsync(() => local.todo.all(), { initialValue: [] })

  async function onSubmit(e: SubmitEvent) {
    /* todo creation ommited */
  }

  async function remove(todo: Todo) {
    await local.todo.delete(todo.id)
  }

  return (
    <div>
      <ul>
        <For each={todos()}>
          {todo => (
            <li>
              {todo.title}
              <button onClick={() => remove(todo)}>
                Delete
              </button>
            </li>
          )}
        </For>
      </ul>
      <form onSubmit={onSubmit}>
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

Since Solid Wire stores are reactive, the todo should be removed from the list automatically.

### Basic Syncing

Up to this point, our data only exists locally in the browser. Let's go back to our store and start syncing the data with our actual database. We start by adding a `sync` function to our store:

```jsx
/* imports ommited */

const store = createWireStore({
  name: "todo-app",
  definition: {
    todo: {} as Todo
  },
  sync: async (records, namspace, syncCursor) => {
    "use server"
    return { records: [], syncCursor: "" }
  },
})

/* UI components ommited */
```

> Notice the `"use server"` marker we added to the start of the function. This tells SolidStart to turn this function into an API endpoint which only runs on the server. You can learn more about server functions in the [official docs](https://docs.solidjs.com/solid-start/reference/server/use-server).

The sync function is a server function that is called by Solid Wire under the hood everytime it needs to persist local changes and/or pull new changes.

For this example, let's ignore `syncCursor` and `namespace` for now and go with a very simple implementation - we will persist the changes from the client and then return the entire todo list back to the client.

```jsx
/* imports ommited */
import { db } from "./db"

const store = createWireStore({
  name: "todo-app",
  definition: {
    todo: {} as Todo
  },
  sync: async (records) => {
    "use server"
    let updated = records.filter(record => record.state === "updated")
    await db.saveTodos(
      updated.map(record => ({ ...record.data, id: record.id }))
    )
    let allTodos = await db.getAllTodos()
    let updates = allTodos.map(item => ({
      id: item.id,
      state: item.deleted ? "deleted" : "updated",
      type: "todo",
      data: item.data
    }))
    return { records: updates, syncCursor: "" }
  },
})

/* UI components ommited */
```

Now let's update the code and account for deleted records. Solid Wire uses the concept of soft delete internally - the records are initially not removed from the local database and are marked as deleted instead. 

In this example, we will use soft delete to "remove" items from our database as well. This is a very common approach when building local-first apps. Deleted todos will have a `deleted` field added to them so we can identify them.


```jsx
/* imports ommited */
import { db } from "./db"

const store = createWireStore({
  name: "todo-app",
  definition: {
    todo: {} as Todo
  },
  sync: async (records) => {
    "use server"
    let updated = records.filter(record => record.state === "updated")
    let deleted = records.filter(record => record.state === "deleted")
    await db.saveTodos(
      updated.map(record => ({ ...record.data, id: record.id }))
    )
    await db.softDeleteTodos(
      deleted.map(record => record.id)
    )
    let allTodos = await db.getAllTodos()
    let updates = allTodos.map(item => ({
      id: item.id,
      state: item.deleted ? "deleted" : "updated",
      type: "todo",
      data: item.data
    }))
    return { records: updates, syncCursor: "" }
  },
})

/* UI components ommited */
```

> The implementation of `db` in the examples is entirely up to you. Solid Wire is databse agnostic and has no opinions on how and where you should store your data.

## Syncing 
## Extensions

