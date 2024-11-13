import { createMutable, } from "solid-js/store"
import { DbRecordType, DbRecordTypes, IdbRecord } from "./models"
import { Accessor, batch, createSignal } from "solid-js"
import { validate } from "./utils"




export function useReactiveIdb(name: string) {
	let [status, setStatus] = createSignal("" as "loading" | "ready")
	let cache = createMutable({} as { [key: string]: { [key: string]: any } })
	for (let type of DbRecordTypes()) {
		cache[type] = {}
	}
	let db: IDBDatabase | undefined
	let subscribers: { [id: string]: Function } = {}


	function listenToUnsyncedChanges(callback: Function) {
		let id = new Date().getTime().toString()
		subscribers[id] = callback
		return () => {
			delete subscribers[id]
		}
	}

	function notifyUnsyncedChanges() {
		setTimeout(() => {
			for (let sub of Object.values(subscribers)) {
				try {
					sub()
				} catch (e) {
					console.error("idb: subscriber threw an exception: ", e)
				}
			}
		}, 1)
	}

	async function deleteMany(items: [type: DbRecordType, id: string][]) {
		const db = await open()
		let updates = await Promise.all(items.map(([type, id]) => new Promise<Function>((resolve, reject) => {
			const request = db.transaction("records", "readwrite").objectStore("records").index("type").openCursor(type)
			request.onsuccess = function(event) {
				const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
				if (cursor) {
					if (cursor.value.id === id) {
						cursor.delete();
						resolve(() => {
							delete cache[type][id]
						});
					} else {
						cursor.continue();
					}
				} else {
					resolve(() => { });
				}
			};
			request.onerror = function(event: any) {
				reject("Error deleting record: " + event.target.error);
			};
		})))
		batch(() => {
			for (let update of updates) {
				update()
			}
		})
	}

	function delete_(type: DbRecordType, id: string) {
		return deleteMany([[type, id]])
	}

	async function setMany<T extends Object & { id: string, deleted?: "true" }>(items: [DbRecordType, data: T][], synced?: boolean): Promise<void> {
		const db = await open()
		let updates = await Promise.all(
			items.map(([type, data]) => new Promise<Function>((resolve, reject) => {
				let record: IdbRecord = {
					id: data.id,
					type,
					data: JSON.parse(JSON.stringify(data)),
				}
				if (data.deleted === "true") {
					record.deleted = "true"
				}
				delete record.data.id
				if (!synced) {
					record.unsynced = "true"
				}
				const request = db.transaction("records", "readwrite").objectStore("records").put(record)
				request.onsuccess = () => {
					resolve(() => {
						cache[record.type][record.id] = data
					})
				}
				request.onerror = (e: any) => {
					reject("error when updating data for type " + type + ": " + e.target.error)
				}
			}))
		)
		batch(() => {
			for (let update of updates) {
				update()
			}
		})
		if (!synced) {
			notifyUnsyncedChanges()
		}
	}

	function set<T extends Object & { id: string, deleted?: "true" }>(type: DbRecordType, data: T, synced?: boolean): Promise<void> {
		return setMany([[type, data]], synced)
	}

	function get<T>(type: DbRecordType, id: string): T {
		return cache[type][id]
	}


	function getAll<T>(type: DbRecordType): T[] {
		return Object.values(cache[type])
	}


	async function getUnsynced(): Promise<IdbRecord[]> {
		const db = await open()
		return new Promise<IdbRecord[]>(async (resolve, reject) => {
			const request = db.transaction("records", "readonly").objectStore("records").index("unsynced").getAll("true")
			request.onsuccess = () => {
				let records = request.result as any[]
				records = filterOutInvalid(records)
				records = records.filter(record => "unsynced" in record && record["unsynced"] === "true")
				resolve(records)
			}
			request.onerror = (e: any) => {
				reject("error when reading records: " + e.target.error)
			}
		})

	}

	function open() {
		return new Promise<IDBDatabase>((resolve, reject) => {
			if (db) {
				resolve(db)
				return
			}
			const open = indexedDB.open(name, 1)
			open.onsuccess = () => {
				db = open.result
				resolve(open.result)
			}
			open.onerror = (e: any) => {
				reject("error when opening the database: " + e.target.error)
				db = undefined
			}
			open.onupgradeneeded = (e: IDBVersionChangeEvent) => {
				const target = e.target as any
				const openedDb = (target as any).result as IDBDatabase
				openedDb.onerror = () => {
					reject("error when setting up the database: " + target.error)
					db = undefined
				}
				let store = openedDb.createObjectStore("records", { keyPath: "id" })
				store.createIndex("unsynced", "unsynced", { unique: false })
				store.createIndex("deleted", "deleted", { unique: false })
				store.createIndex("type", "type", { unique: false })
			}
			open.onblocked = () => {
				reject("error when opening the database: database blocked")
				db = undefined
			}
		})
	}

	function deleteFromCache(type: DbRecordType, id: string) {
		delete cache[type][id]
	}

	function filterOutDeleted(records: any[]): any[] {
		return records.filter(
			(record: any) => !(typeof record === "object" && "deleted" in record)
		)
	}
	function filterOutInvalid(records: any[]): any[] {
		return records.filter(
			(record: any) => {
				try {
					validate.idbRecord(record)
					return true
				} catch (e) {
					console.error("invalid record: " + e, record)
					return false
				}
			}
		)
	}

	async function start() {
		if (status() === "loading") return
		setStatus("loading")
		await new Promise(async (resolve, reject) => {
			const db = await open()
			const request = db.transaction("records", "readonly").objectStore("records").getAll()
			request.onsuccess = () => {
				let records = filterOutDeleted(request.result)
				records = filterOutInvalid(records)
				for (let record of records) {
					record.data.id = record.id
					cache[record.type][record.id] = record.data
				}
				resolve(undefined)
			}
			request.onerror = (e: any) => {
				reject("error when reading records: " + e.target.error)
			}
		})
		setStatus("ready")
	}

	start()

	return {
		ready: (() => status() === "ready") as Accessor<boolean>,
		listenToUnsyncedChanges,
		deleteMany,
		delete: delete_,
		deleteFromCache,
		set,
		setMany,
		get,
		getAll,
		getUnsynced,
	}
}
