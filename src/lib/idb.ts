import { calculator } from "./calculator"
import { Account, Transaction, Category, TransactionWithRefs, CarryOver, ParsedTransactionId as ParsedTransactionId } from "./models"
import { DateOnly } from "./utils"

type StoreName = "accounts" | "categories" | "transactions" | "carryovers"

class IndexedDbWrapper {
	private databaseName: string
	private db?: IDBDatabase
	private carryOverCategory: Category = { id: "carryover", name: "Carry Over", icon: "" }

	constructor(databaseName: string) {
		this.databaseName = databaseName
	}

	async saveTransaction(transaction: Transaction) {
		let parsedId = parseTransactionId(transaction.id)
		if (parsedId.carryOver) {
			let carryOver: CarryOver = {
				id: transaction.id,
				amount: transaction.amount
			}
			await this.set("carryovers", carryOver)
		} else {
			await this.set("transactions", transaction)
		}
	}

	async getTransactionById(id: string): Promise<TransactionWithRefs> {
		let parsedId = parseTransactionId(id)
		if (parsedId.carryOver) {
			let account = await this.get<Account>("accounts", parsedId.carryOver.accountId)
			if (!account) throw Error("invalid carryover id: account not found")
			let cutoff = await this.getCutoffDate()
			let carryOver = await this.getCarryOver(account, parsedId.carryOver.year, parsedId.carryOver.month, cutoff)
			return {
				...carryOver,
				account: account,
				category: this.carryOverCategory,
			}
		}
		let accounts = await this.getAll<Account>("accounts")
		let categories = await this.getAll<Category>("categories")
		let transaction = await this.get<Transaction>("transactions", id)
		debugger
		return {
			...transaction,
			account: accounts.find(account => account.id == transaction.accountId)!,
			category: categories.find(category => category.id == transaction.categoryId)!,
		}
	}

	private async getCarryOver(account: Account, year: number, month: number, cutoff: DateOnly): Promise<Transaction> {
		let thisMonth = DateOnly.fromYearMonth(year, month)
		let id = buildCarryOverId(thisMonth, account.id)
		let carryover: Transaction = {
			id: id,
			type: "carryover",
			name: `Carry Over ${account.name}`,
			date: `${thisMonth.toYearMonthString()}-01`,
			yearMonthIndex: thisMonth.toYearMonthString(),
			accountId: account.id,
			categoryId: this.carryOverCategory.id,
			amount: 0,
		}
		if (thisMonth.date.getTime() < cutoff.date.getTime()) {
			return carryover
		}
		let manual = await this.get<CarryOver>("carryovers", id)
		if (manual) {
			carryover.amount = manual.amount
		} else {
			let previousMonth = thisMonth.addMonths(-1)
			let previousTransactions = (await idb.filter<Transaction>(
				"transactions",
				"yearMonthIndex",
				previousMonth.toYearMonthString(),
			)).filter(t => t.accountId === account.id)
			let previousCarryOver = await this.getCarryOver(account, previousMonth.year, previousMonth.month, cutoff)
			previousTransactions.push(previousCarryOver)
			carryover.amount = calculator.summary(previousTransactions).total
		}
		return carryover
	}

	private async getCutoffDate() {
		let firstTransaction = await this.filterFirst<Transaction>("transactions", "dateIndex", null)
		return new DateOnly(firstTransaction?.date || new Date())
	}

	async getTransactionsByMonth(year: number, month: number): Promise<TransactionWithRefs[]> {
		// TODO: order by date from the oldest
		let cutoff = await this.getCutoffDate()
		let accounts = await this.getAll<Account>("accounts")
		let categories = await this.getAll<Category>("categories")
		categories.push({ ...this.carryOverCategory })
		let transactions = await idb.filter<Transaction>(
			"transactions",
			"yearMonthIndex",
			DateOnly.yearMonthString(year, month)
		)
		for (let account of accounts) {
			transactions.push(await this.getCarryOver(account, year, month, cutoff))
		}
		return transactions.map<TransactionWithRefs>(transaction => {
			return {
				...transaction,
				account: accounts.find(account => account.id == transaction.accountId)!,
				category: categories.find(category => category.id == transaction.categoryId)!,
			}
		})
	}

	private open() {
		return new Promise<IDBDatabase>((resolve, reject) => {
			if (this.db) {
				resolve(this.db)
				return
			}
			const open = indexedDB.open(this.databaseName, 1)
			open.onsuccess = () => {
				this.db = open.result
				resolve(open.result)
			}
			open.onerror = (e: any) => {
				reject("error when opening the database: " + e.target.error)
				this.db = undefined
			}
			open.onupgradeneeded = (e: IDBVersionChangeEvent) => {
				const target = e.target as any
				const db = (target as any).result as IDBDatabase
				db.onerror = () => {
					reject("error when setting up the database: " + target.error)
					this.db = undefined
				}
				db.createObjectStore("accounts", { keyPath: "id" })
				db.createObjectStore("categories", { keyPath: "id" })
				db.createObjectStore("carryovers", { keyPath: "id" })
				const transactionsStore = db.createObjectStore("transactions", { keyPath: "id" })
				transactionsStore.createIndex("yearMonthIndex", "yearMonthIndex", { unique: false })
				transactionsStore.createIndex("dateIndex", "date", { unique: false })
			}
			open.onblocked = () => {
				reject("error when opening the database: database blocked")
				this.db = undefined
			}
		})
	}

	delete(store: StoreName, id: string) {
		return new Promise(async (resolve, reject) => {
			const db = await this.open()
			const request = db.transaction(store, "readwrite").objectStore(store).delete(id)
			request.onsuccess = () => {
				resolve(undefined)
			}
			request.onerror = (e: any) => {
				reject("error when updating data for store " + store + ": " + e.target.error)
			}
		})
	}

	set<T>(store: StoreName, data: T): Promise<void> {
		return new Promise(async (resolve, reject) => {
			const db = await this.open()
			const request = db.transaction(store, "readwrite").objectStore(store).put(data)
			request.onsuccess = () => {
				resolve()
			}
			request.onerror = (e: any) => {
				reject("error when updating data for store " + store + ": " + e.target.error)
			}
		})
	}

	get<T>(store: StoreName, id: string): Promise<T> {
		return new Promise(async (resolve, reject) => {
			const db = await this.open()
			const request = db.transaction(store, "readonly").objectStore(store).get(id)
			request.onsuccess = () => {
				resolve(request.result)
			}
			request.onerror = (e: any) => {
				reject("error when reading data for store " + store + " with id " + id + ": " + e.target.error)
			}
		})
	}

	filter<T>(store: StoreName, index: string, value: string): Promise<T[]> {
		return new Promise(async (resolve, reject) => {
			const db = await this.open()
			const request = db.transaction(store, "readonly").objectStore(store).index(index).getAll(value)
			request.onsuccess = () => {
				resolve(request.result)
			}
			request.onerror = (e: any) => {
				reject("error when reading data for store " + store + ": " + e.target.error)
			}
		})
	}

	filterFirst<T>(store: StoreName, index: string, value: string | null): Promise<T | undefined> {
		return new Promise(async (resolve, reject) => {
			const db = await this.open()
			const request = db.transaction(store, "readonly").objectStore(store).index(index).openCursor(value, "next")
			request.onsuccess = (event: any) => {
				const cursor = event.target.result;
				if (cursor) {
					resolve(cursor.value);
				} else {
					resolve(undefined);
				}
			}
			request.onerror = (e: any) => {
				reject("error when reading data for store " + store + ": " + e.target.error)
			}
		})
	}

	getAll<T>(store: StoreName): Promise<T[]> {
		return new Promise(async (resolve, reject) => {
			const db = await this.open()
			const request = db.transaction(store, "readonly").objectStore(store).getAll()
			request.onsuccess = () => {
				resolve(request.result)
			}
			request.onerror = (e: any) => {
				reject("error when reading data for store " + store + ": " + e.target.error)
			}
		})
	}
}

function parseTransactionId(id: string): ParsedTransactionId {
	if (!id.startsWith("carryover")) return {}
	let result = /^carryover-(\d{4})-(\d{2})-(.+)$/.exec(id)
	if (result?.length != 4) throw Error("invalid carryover id")
	let year = parseInt(result[1])
	if (isNaN(year)) throw Error("invalid carryover id")
	let month = parseInt(result[2])
	if (isNaN(month)) throw Error("invalid carryover id")
	let accountId = result[3]
	return {
		carryOver: {
			year: year,
			month: month,
			accountId: accountId,
		},
	}
}

function buildCarryOverId(date: DateOnly, accountId: string) {
	return `carryover-${date.toYearMonthString()}-${accountId}`
}

export const idb = new IndexedDbWrapper("solid-money")



