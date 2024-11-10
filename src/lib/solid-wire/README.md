# Solid Wire

Solid Wire is a native SolidJS library for building local-first apps with SolidJS and SolidStart. Unlike many of the alternative local-first libraries out there, Solid Wire is designed and built from the ground up specifically to work with SolidJS and SolidStart, and to take full advantage of some powerful primitives such as `createAsync` and server functions (with `use server`).

## How it works

Solid Wire stores the data locally in the browser using [indexed-db](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API). The data is then synced with the server/database using a simple and powerful sync mechanism called `push-pull`. Unlike other sync mechanisms, `push-pull` uses a single API endpoint. When syncing, the client calls the `push-pull` API endpoint, sends all its pending local writes, and receives back any new updates.

Solid Wire handles all the syncing logic and indexed-db interfacing for you. What is left for you is to write the code that persists the data to your favorite database. 

# Getting Started

## Installation and Setup

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

## Creating a Wire Store

Solid Wire uses the concept of Wire Store for working with your data. A Wire Store is a data store that "wires" the data that is locally stored in the browser with the data that is stored on your server/database.

Let's start by a creating a new store using the `createWireStore` function. In this example, we are creating a store for a simple Todo app:

```ts
import { createWireStore } from "./solid-wire";

export const store = createWireStore({
    name: "todo-app",
})
```

## Defining the data structure

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


## Registering the store

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

## Reading data

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


## Writing data

### Adding/upating

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

```jsx
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

### Deleting

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

## Basic Syncing

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

# Learn
## Data APIs

Solid Wire provides simple to use APIs for working with the data in your wire stores. When creating your wire store, you start by defining all the data types you want to have in your store. The resulting wire store exposes a few data APIs functions to help you interact with each data type.

Let's take the store below as example for a simple project tracking app:

```ts
type Task = { id: string, title: string, done: boolean, projectId: string }
type Project = { id: string, name: string, completed: boolean }

const store = createWireStore({
  name: "my-app",
  definition: {
    task: {} as Task,
    project: {} as Project,
  },
  /* remaining setup ommited */
})
```

With data structure above, the following data API become available in our store:

- `store.task.all`
- `store.task.get`
- `store.task.set`
- `store.task.delete`

- `store.project.get`
- `store.project.all`
- `store.project.set`
- `store.project.delete`

We will discuss each of these APIs in the next sections.

### get

The `get` API in the wire store is used to retrieve a single record of a given type by ID. If the item does not exist, the function will return `undefined`.

Because this is an async function, we need to wrap the function using `createAsync` so the records can be loaded asynchronously.

Here is an example showing how to query and display project details in a simple project tracking app. The example assumes the ID of the project comes from URL (e.g. `src/routes/projects/[id].tsx`).

```jsx
/* store setup ommited */

function ProjectPage() {
  let params = useParams()
  let local = store.use()
  let project = createAsync(() => local.project.get(params.id))
  return (
  <Show when={project()}>
    {project => (
      <h1>{project().name}</h1>
      {/* ommited */}
    )}
  </Show>
  )
}
```

One thing to note is that wire stores are reactive. This means that when using `get` wrapped in `createAsync`, the query will automatically be executed again when `params.id` change (e.g. when the user navigates to a different project page), causing the UI to automatically and conveniently update. To learn more about `createSync`, check out the [official docs](https://docs.solidjs.com/solid-router/reference/data-apis/create-async).


Another thing to note is that, because all the data we are accessing is local and it will be retrieved super fast, there is really no reason to show loading indicators or use any of the [cache functionalities](https://docs.solidjs.com/solid-router/reference/data-apis/query) of SolidStart.

### all

The `all` API in the wire store is used to retrieve all records of a given type. If no items are found, an empty list will be returned.

Because this is an async function, we need to wrap the function using `createAsync` so the records can be loaded asynchronously.

Here is an example showing how to query and display a list of projects in a simple project tracking app:

```jsx
/* store setup ommited */

function ProjectListPage() {
  let local = store.use()
  let projects = createAsync(() => local.project.all(), { initialValue: [] })
  return (
    <ul>
      <For each={projects()}>
        {project => (
          <li>{project.name}</li>
        )}
      </For>
    </ul>
  )
}
```

> Notice how we use an empty array as `initialValue` to avoid the `projects` variable from being potentially `undefined`. Without that setting, you might need to wrap the list in either a `<Suspense>` or `<Show>` component in order to allow waiting for the data to be available.

One thing to note is that wire stores are reactive. This means that when using `all` wrapped in `createAsync`, if new projects are added to the store, the list will be updated automatically. To learn more about `createSync`, check out the [official docs](https://docs.solidjs.com/solid-router/reference/data-apis/create-async).

Another thing to note is that, because all the data we are accessing is local and it will be retrieved super fast, there is really no reason to show loading indicators or use any of the [cache functionalities](https://docs.solidjs.com/solid-router/reference/data-apis/query) of SolidStart.

### set

The `set` API in the wire store is used to either create or update records of a given type by ID. This is a void function. If no exceptions are thrown, this means the write operation was successful. 

Here is an example of using the `set` API to update project details in simple project tracking app. The example assumes the ID of the project comes from URL (e.g. `src/routes/projects/[id]/edit.tsx`).

```jsx
/* store setup ommited */

function ProjectEditPage() {
  let params = useParams()
  let local = store.use()
  let project = createAsync(() => local.project.get(params.id))

  async function onSubmit(e) {
    e.preventDefault()
    let data = new FormData(e.target)
    let update = {
      ...project(),
      name: data.get("name")
    }
    await store.project.set(update.id, update)
  }

  return (
  <Show when={project()}>
    {project => (
      <form onSubmit={onSubmit}>
        <label for="name">Name</label>
        <input id="name" name="name" value={project().name} required/>
        <button>Save</button>
      </form>
    )}
  </Show>
  )
}
```

One thing to note is that wire stores are reactive. This means that when using `set` to update the record, the `get` call wrapped in `createAsync` will triggered again, causing the UI to automatically reflect the changes. To learn more about `createSync`, check out the [official docs](https://docs.solidjs.com/solid-router/reference/data-apis/create-async).

Here is another example of using the `set` API to create a new project:

```jsx
/* store setup ommited */

function ProjectCreatePage() {
  let local = store.use()

  async function onSubmit(e) {
    e.preventDefault()
    let data = new FormData(e.target)
    let project = {
      id: new Date().getTime().toString(),
      name: data.get("name"),
    }
    await store.project.set(project.id, project)
  }

  return (
  <div>
      <h1>Create Project</h1>
      <form onSubmit={onSubmit}>
        <label for="name">Name</label>
        <input id="name" name="name" required/>
        <button>Save</button>
      </form>
  </div>
  )
}
```

Notice how we are generating the `id` for the project locally in the browser. This is a requirement for implementing local-first apps. It allows records to be created without requiring a round trip to the server. It also simplifies write operations as creating and updating records become essentially the same type of operation. 


### delete

The `delete` API is used to soft-delete a given record type by ID. This is a void function. If no exceptions are thrown, this means the delete operation was successful or that the record did not exist.

Soft-delete means the record is not actually removed from the local indexed-db instance. The record is instead marked as deleted. This greatly simplifies the syncing mechanisms as there will be no need to manually track delete events separately. Solid Wire automatically filters out soft-deleted records when using `get` or `all` APIs. There is no reason for you to track that yourself.

Here is an example of deleting a project in a list in a simple project management app:


```jsx
/* store setup ommited */

function ProjectList() {
  let local = store.use()
  let projects = createAsync(() => local.project.all(), { initialValue: [] })

  async function remove(project: Project) {
    await local.project.delete(project.id)
  }

  return (
      <ul>
        <For each={projects()}>
          {project => (
            <li>
              {project.name}
              <button onClick={() => remove(project)}>
                Delete
              </button>
            </li>
          )}
        </For>
      </ul>
  )
}
```

One thing to note is that wire stores are reactive. This means that when deleting a record using `delete`, the `all` call wrapped in `createAsync` will be triggered again, causing the UI to automatically reflect the changes and remove the deleted item. To learn more about `createSync`, check out the [official docs](https://docs.solidjs.com/solid-router/reference/data-apis/create-async).

### Custom APIs
## Syncing 
### Using Timestamp
### Using versions
### Real-time
## Namespacing 

Namespacing is a key feature of Solid Wire. It allows you to store data in the browser in different indexed-db instances in order to keep data from different users/accounts separated. Without namespacing, all the data in your app would internally be store in a single indexed-db instance, meaning all the users of your site/app would interact with the same data.

Having all the data of your app stored in a single indexed-db instance might be the desired outcome, though. This is typically the case when deploying mobile apps using web technologies where the app is hosted in an isolated browser instance using WebView, and there is no authentication. The natural isolation created in this scenario is enough to allow you to avoid namespacing.

In most cases, however, you will need namespacing to assure users only interact with their data.

### How it works

When creating wire stores, namespaces are used to composed the name of the indexed-db databases under the hood. Solid Wire uses the follwing format for determining database names:

```
wire-store:${storeName}:${namespace}
```

You define the namespace to use in your app when mounting the store. You can pass it to the provider using the `namespace` props: 

```jsx
<store.Provider namespace="some-value">
  { /* children goes here */ }
</store.Provider>
```

You can then use that namespace in your `sync` function:

```ts

const store = createWireStore({
  /* setup ommited */
  sync: async (records, namespace, syncCursor) => {
    "use server"
    /* syncing logic goes here */
  },
})
```

### Basic example 

A typical approach for namespacing is to use the ID of the current user/account as the namespace. Here is an example on how to achieve that using a [protected](https://docs.solidjs.com/solid-start/building-your-application/routing#route-groups) SolidStart route group `src/routes/(protected).tsx`. Notice how the store is only mounted once we have a valid logged in user.

```jsx
/* imports ommited */

export default function ProtectedSection(props: RouteSectionProps) {
  let user = createAsync(getCurrentUser)
  return (
    <Show when={user()}>
      {user => (
        <store.Provider namespace={user().id}>
          {props.children}
        </store.Provider>
      )}
    </Show>
  )
}
```

With that setting, the internal indexed-db instance will be named using the format below, resulting in a different indexed-db instance for each user.

```
wire-store:${storeName}:${userId}
```

When it comes to syncing, Solid Wire will send the provided namespace everytime it calls the `sync` endpoint. This allows you to use that namespace in however way you needed in your syncing logic:

```ts

const store = createWireStore({
  /* setup ommited */
  sync: async (records, namespace, syncCursor) => {
    "use server"
    // getUser throws a redirect when user is not authenticated
    let user = await getUser() 
    // let's make sure we are getting the right namespace 
    if (user.id !== namespace) throw Error("bad request")

    /* syncing logic ommited */
  },
})
```

> A common question that arises from the example above is - if the namespace is the same as the user ID, why do I need an extra step to get the current user? And why do I need to check it user ID really matches the namespace? The answer is simple - for security reasons. Being a server function, the `sync` function is very much a public API endpoint, which means we should never trust the inputs coming in. The `getUser` function in the example uses [SolidStart sessions](https://docs.solidjs.com/solid-start/advanced/session#sessions) to determine the current user, which is the correct way to check if the user is authenticated.

# Guides
## Auth
## Security 
TBD: talk about erasing the data on logout? Encryption?
