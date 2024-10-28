import { createMutable, } from "solid-js/store"
import { DbRecordType, DbRecordTypes } from "./models"
import { Accessor, createSignal } from "solid-js"

type StoreName = DbRecordType

export type IdbRecord = {
	id: string,
	unsynced?: "true"
	deleted?: "true"
	store: StoreName
	[key: string]: any
}


export function useReactiveIdb(name: string, cacheFilter?: (...records: any) => any[]) {
	let [status, setStatus] = createSignal("" as "loading" | "ready")
	let cache = createMutable({
		accounts: {},
		categories: {},
		transactions: {},
		carryovers: {},
		recurrencies: {}
	} as { [key: string]: { [key: string]: any } })

	let db: IDBDatabase | undefined
	let subscribers: { [id: string]: Function } = {}


	function subscribe(callback: Function) {
		let id = new Date().getTime().toString()
		subscribers[id] = callback
		return () => {
			delete subscribers[id]
		}
	}

	function notify() {
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


	function delete_(store: StoreName, id: string) {
		return new Promise(async (resolve, reject) => {
			const db = await open()
			const request = db.transaction(store, "readwrite").objectStore(store).delete(id)
			request.onsuccess = () => {
				delete cache[store][id]
				resolve(undefined)
			}
			request.onerror = (e: any) => {
				reject("error when updating data for store " + store + ": " + e.target.error)
			}
		})
	}


	function set<T extends Object & { id: string }>(store: StoreName, data: T, synced?: boolean): Promise<void> {
		return new Promise(async (resolve, reject) => {
			const db = await open()
			if (!synced) {
				((data as any) as IdbRecord).unsynced = "true"
			}
			const request = db.transaction(store, "readwrite").objectStore(store).put(data)
			request.onsuccess = () => {
				cache[store][data.id] = data
				resolve()
				notify()
			}
			request.onerror = (e: any) => {
				reject("error when updating data for store " + store + ": " + e.target.error)
			}
		})
	}

	function get<T>(store: StoreName, id: string): T {
		return cache[store][id]
	}


	function getAll<T>(store: StoreName): T[] {
		return Object.values(cache[store])
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
				let accounts = openedDb.createObjectStore("accounts", { keyPath: "id" })
				let categories = openedDb.createObjectStore("categories", { keyPath: "id" })
				let carryovers = openedDb.createObjectStore("carryovers", { keyPath: "id" })
				let transactions = openedDb.createObjectStore("transactions", { keyPath: "id" })
				let recurrencies = openedDb.createObjectStore("recurrencies", { keyPath: "id" })

				carryovers.createIndex("yearMonthIndex", "yearMonthIndex", { unique: false })
				transactions.createIndex("yearMonthIndex", "yearMonthIndex", { unique: false })
				transactions.createIndex("dateIndex", "date", { unique: false })
				recurrencies.createIndex("dateIndex", "date", { unique: false })

				for (let store of [
					accounts,
					categories,
					carryovers,
					recurrencies,
					transactions,
				]) {
					store.createIndex("unsynced", "unsynced", { unique: false })
				}
			}
			open.onblocked = () => {
				reject("error when opening the database: database blocked")
				db = undefined
			}
		})
	}

	function deleteFromCache(store: StoreName, id: string) {
		delete cache[store][id]
	}

	async function start() {
		if (status() === "loading") return
		setStatus("loading")
		await Promise.all(
			DbRecordTypes().map(store => (
				new Promise(async (resolve, reject) => {
					const db = await open()
					const request = db.transaction(store, "readonly").objectStore(store).getAll()
					request.onsuccess = () => {
						let records = cacheFilter ? cacheFilter(...request.result) : request.result
						for (let record of records) {
							cache[store][record.id] = record
						}
						resolve(undefined)
					}
					request.onerror = (e: any) => {
						reject("error when reading data for store " + store + ": " + e.target.error)
					}
				})
			))
		)
		setStatus("ready")
	}

	start()

	return {
		ready: (() => status() === "ready") as Accessor<boolean>,
		subscribe,
		delete: delete_,
		deleteFromCache,
		set,
		get,
		getAll,
		open,
	}
}


// export class Idb {
// 	private name: string = ""
// 	private db?: IDBDatabase
// 	private subscribers: { [id: string]: Function } = {}
//
// 	constructor(name: string) {
// 		this.name = name
// 	}
//
// 	subscribe(callback: Function) {
// 		let id = new Date().getTime().toString()
// 		this.subscribers[id] = callback
// 		return () => {
// 			delete this.subscribers[id]
// 		}
// 	}
//
// 	private notify() {
// 		setTimeout(() => {
// 			for (let sub of Object.values(this.subscribers)) {
// 				try {
// 					sub()
// 				} catch (e) {
// 					console.error("idb: subscriber threw an exception: ", e)
// 				}
// 			}
// 		}, 1)
// 	}
//
// 	private filterDeleted(...records: any): any[] {
// 		return records.filter(
// 			(record: any) => !(typeof record === "object" && "deleted" in record)
// 		)
// 	}
//
// 	deleteForever(store: StoreName, id: string) {
// 		return new Promise(async (resolve, reject) => {
// 			const db = await this.open()
// 			const request = db.transaction(store, "readwrite").objectStore(store).delete(id)
// 			request.onsuccess = () => {
// 				resolve(undefined)
// 			}
// 			request.onerror = (e: any) => {
// 				reject("error when updating data for store " + store + ": " + e.target.error)
// 			}
// 		})
// 	}
//
// 	async delete(store: StoreName, id: string) {
// 		let d = await this.get(store, id)
// 		if (!d) return
// 		let record = {
// 			id,
// 			deleted: "true",
// 		}
// 		this.set(store, record, false)
// 	}
//
// 	set<T extends Object>(store: StoreName, data: T, synced?: boolean): Promise<void> {
// 		return new Promise(async (resolve, reject) => {
// 			const db = await this.open()
// 			if (!synced) {
// 				((data as any) as IdbRecord).unsynced = "true"
// 			}
// 			const request = db.transaction(store, "readwrite").objectStore(store).put(data)
// 			request.onsuccess = () => {
// 				resolve()
// 				this.notify()
// 			}
// 			request.onerror = (e: any) => {
// 				reject("error when updating data for store " + store + ": " + e.target.error)
// 			}
// 		})
// 	}
//
// 	get<T>(store: StoreName, id: string): Promise<T> {
// 		return new Promise(async (resolve, reject) => {
// 			const db = await this.open()
// 			const request = db.transaction(store, "readonly").objectStore(store).get(id)
// 			request.onsuccess = () => {
// 				resolve(
// 					this.filterDeleted(request.result)[0]
// 				)
// 			}
// 			request.onerror = (e: any) => {
// 				reject("error when reading data for store " + store + " with id " + id + ": " + e.target.error)
// 			}
// 		})
// 	}
//
// 	filter<T>(store: StoreName, index: string, value: string): Promise<T[]> {
// 		return new Promise(async (resolve, reject) => {
// 			const db = await this.open()
// 			const request = db.transaction(store, "readonly").objectStore(store).index(index).getAll(value)
// 			request.onsuccess = () => {
// 				resolve(
// 					this.filterDeleted(...request.result)
// 				)
// 			}
// 			request.onerror = (e: any) => {
// 				reject("error when reading data for store " + store + ": " + e.target.error)
// 			}
// 		})
// 	}
//
// 	filterFirst<T>(store: StoreName, index: string, value: string | null): Promise<T | undefined> {
// 		return new Promise(async (resolve, reject) => {
// 			const db = await this.open()
// 			const request = db.transaction(store, "readonly").objectStore(store).index(index).openCursor(value, "next")
// 			request.onsuccess = (event: any) => {
// 				const cursor = event.target.result;
// 				if (cursor) {
// 					resolve(
// 						this.filterDeleted(cursor.value)[0]
// 					);
// 				} else {
// 					resolve(undefined);
// 				}
// 			}
// 			request.onerror = (e: any) => {
// 				reject("error when reading data for store " + store + ": " + e.target.error)
// 			}
// 		})
// 	}
//
// 	getAll<T>(store: StoreName): Promise<T[]> {
// 		return new Promise(async (resolve, reject) => {
// 			const db = await this.open()
// 			const request = db.transaction(store, "readonly").objectStore(store).getAll()
// 			request.onsuccess = () => {
// 				resolve(
// 					this.filterDeleted(...request.result)
// 				)
// 			}
// 			request.onerror = (e: any) => {
// 				reject("error when reading data for store " + store + ": " + e.target.error)
// 			}
// 		})
// 	}
//
//
// 	open() {
// 		return new Promise<IDBDatabase>((resolve, reject) => {
// 			if (this.db) {
// 				resolve(this.db)
// 				return
// 			}
// 			const open = indexedDB.open(this.name, 1)
// 			open.onsuccess = () => {
// 				this.db = open.result
// 				resolve(open.result)
// 			}
// 			open.onerror = (e: any) => {
// 				reject("error when opening the database: " + e.target.error)
// 				this.db = undefined
// 			}
// 			open.onupgradeneeded = (e: IDBVersionChangeEvent) => {
// 				const target = e.target as any
// 				const db = (target as any).result as IDBDatabase
// 				db.onerror = () => {
// 					reject("error when setting up the database: " + target.error)
// 					this.db = undefined
// 				}
// 				let accounts = db.createObjectStore("accounts", { keyPath: "id" })
// 				let categories = db.createObjectStore("categories", { keyPath: "id" })
// 				let carryovers = db.createObjectStore("carryovers", { keyPath: "id" })
// 				let transactions = db.createObjectStore("transactions", { keyPath: "id" })
// 				let recurrencies = db.createObjectStore("recurrencies", { keyPath: "id" })
//
// 				carryovers.createIndex("yearMonthIndex", "yearMonthIndex", { unique: false })
// 				transactions.createIndex("yearMonthIndex", "yearMonthIndex", { unique: false })
// 				transactions.createIndex("dateIndex", "date", { unique: false })
// 				recurrencies.createIndex("dateIndex", "date", { unique: false })
//
// 				for (let store of [
// 					accounts,
// 					categories,
// 					carryovers,
// 					recurrencies,
// 					transactions,
// 				]) {
// 					store.createIndex("unsynced", "unsynced", { unique: false })
// 				}
// 			}
// 			open.onblocked = () => {
// 				reject("error when opening the database: database blocked")
// 				this.db = undefined
// 			}
// 		})
// 	}
// }

