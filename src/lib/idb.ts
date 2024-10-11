import { calculator } from "./calculator"
import { Account, Transaction, Category, TransactionWithRefs, CarryOver, ParsedTransactionId as ParsedTransactionId } from "./models"
import { DateOnly } from "./utils"

type StoreName = "accounts" | "categories" | "transactions" | "carryovers" | "recurrencies"

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
		} else if (parsedId.recurrency || transaction.recurrency) {
			this.saveRecurrentTransaction(transaction, parsedId)
		} else {
			await this.set("transactions", transaction)
		}
	}

	private async saveRecurrentTransaction(transaction: Transaction, parsedId: ParsedTransactionId) {
		if (parsedId.recurrency) {
			// TODO: CONTINUE: Split and save when targetting next occurrences
			if (parsedId.recurrency.index === 0) {
				await this.set("recurrencies", { ...transaction, id: parsedId.recurrency.id })
			} else {
				let base = await this.get<Transaction>("recurrencies", parsedId.recurrency.id)
				if (!base) throw Error(`Recurrency with id '${parsedId.recurrency.id}' not found`)
				if (!base.recurrency) throw Error(`Recurrency with id '${parsedId.recurrency.id}' is corrupted`)
				let occurrence = await this.getOccurrenceByIndex(base, parsedId.recurrency.index)
				base.recurrency.endDate = occurrence.date
				await this.set("recurrencies", base)
				transaction.id = new Date().getTime().toString()
				await this.set("recurrencies", transaction)
			}
		} else {
			await this.set("recurrencies", transaction)
		}
	}

	async getTransactionById(id: string): Promise<TransactionWithRefs> {
		let parsedId = parseTransactionId(id)
		if (parsedId.carryOver) {
			let account = await this.get<Account>("accounts", parsedId.carryOver.accountId)
			if (!account) throw Error(`invalid carryover id '${id}': account not found`)
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
		let transaction: Transaction
		if (parsedId.recurrency) {
			let recurrent = await this.get<Transaction>("recurrencies", parsedId.recurrency.id)
			if (!recurrent) throw Error(`invalid recurrency id '${id}': recurrency not found`)
			transaction = await this.getOccurrenceByIndex(recurrent, parsedId.recurrency.index)
		} else {
			transaction = await this.get<Transaction>("transactions", id)
		}

		return {
			...transaction,
			account: accounts.find(account => account.id == transaction.accountId)!,
			category: categories.find(category => category.id == transaction.categoryId)!,
		}
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

		let recurrent = await this.getRecurrentTransactionsByMonth(year, month)
		transactions.push(...recurrent)

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

	private async getOccurrenceByIndex(transaction: Transaction, index: number): Promise<Transaction> {
		if (!transaction.recurrency) throw Error(`transaction '${transaction.id}' does not have recurrency settings`)
		if (index === 0) return {
			...JSON.parse(JSON.stringify(transaction)),
			id: `${transaction.id}:0`
		}
		let recurrency = transaction.recurrency
		let current = new DateOnly(transaction.date)
		let endOfMonth = current.addDays(1).date.getDate() == 1
		for (let i = 1; true; ++i) {
			if (recurrency.interval === "month") {
				if (endOfMonth) {
					// this assures that the date always falls on the end of the month, whether it is 31, 30 or even 28 (Feb)
					current = current.addDays(1).addMonths(1).addDays(-1)
				} else {
					current = current.addMonths(recurrency.multiplier)
				}
			}
			else if (recurrency.interval === "week") {
				current = current.addDays(7 * recurrency.multiplier)
			}
			else if (recurrency.interval === "year") {
				current = current.addYears(recurrency.multiplier)
			}
			else {
				throw Error(`unexpected interval type for transaction id '${transaction.id}': ${recurrency.interval}`)
			}
			if (recurrency.endDate && current.time >= new DateOnly(recurrency.endDate).time) break
			if (index === i) {
				return {
					...JSON.parse(JSON.stringify(transaction)),
					id: `${transaction.id}:${index}`,
					date: current.toString(),
				}
			}
		}
		throw Error(`transaction '${transaction.id}' does not have occurrence at index ${index}`)
	}

	private async getRecurrentTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
		let start = DateOnly.fromYearMonth(year, month)
		let end = start.addMonths(1).addDays(-1)
		let transactions: Transaction[] = []
		let recurrencies = await this.getAll<Transaction>("recurrencies")
		for (let transaction of recurrencies) {
			if (transaction.yearMonthIndex === DateOnly.yearMonthString(year, month)) {
				transactions.push({
					...transaction,
					id: `${transaction.id}:0`
				})
			}
			if (!transaction.recurrency) continue
			let recurrency = transaction.recurrency
			let current = new DateOnly(transaction.date)
			let endOfMonth = current.addDays(1).date.getDate() == 1
			for (let i = 1; true; ++i) {
				if (recurrency.interval === "month") {
					if (endOfMonth) {
						// this assures that the date always falls on the end of the month, whether it is 31, 30 or even 28 (Feb)
						current = current.addDays(1).addMonths(1).addDays(-1)
					} else {
						current = current.addMonths(recurrency.multiplier)
					}
				}
				else if (recurrency.interval === "week") {
					current = current.addDays(7 * recurrency.multiplier)
				}
				else if (recurrency.interval === "year") {
					current = current.addYears(recurrency.multiplier)
				}
				else {
					throw Error(`unexpected interval type for transaction id '${transaction.id}': ${recurrency.interval}`)
				}
				if (current.time > end.time) break
				if (recurrency.endDate && current.time >= new DateOnly(recurrency.endDate).time) break
				if (current.time >= start.time && current.time <= end.time) {
					let occurrence = JSON.parse(JSON.stringify(transaction)) as Transaction
					occurrence.date = current.toString()
					occurrence.id = `${occurrence.id}:${i}`
					transactions.push(occurrence)
				}
			}
		}
		return transactions
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
			)).filter(transaction => transaction.accountId === account.id)

			let previousRecurrencies = (await this.getRecurrentTransactionsByMonth(
				previousMonth.year,
				previousMonth.month
			)).filter(transaction => transaction.accountId === account.id)
			previousTransactions.push(...previousRecurrencies)

			let previousCarryOver = await this.getCarryOver(account, previousMonth.year, previousMonth.month, cutoff)
			previousTransactions.push(previousCarryOver)

			carryover.amount = calculator.summary(previousTransactions).total
		}
		return carryover
	}

	private async getCutoffDate() {
		let firstRecurrency = await this.filterFirst<Transaction>("recurrencies", "dateIndex", null)
		let firstRecurrencyDate = new DateOnly(firstRecurrency?.date || new Date())
		let firstTransaction = await this.filterFirst<Transaction>("transactions", "dateIndex", null)
		let firstTransactionDate = new DateOnly(firstTransaction?.date || new Date())
		return [firstRecurrencyDate, firstTransactionDate].sort((a, b) => a.time - b.time)[0]
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
				let recurrenciesStore = db.createObjectStore("recurrencies", { keyPath: "id" })
				recurrenciesStore.createIndex("dateIndex", "date", { unique: false })
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

export function parseTransactionId(id: string): ParsedTransactionId {
	if (id.startsWith("carryover")) {
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
	let parts = id.split(":")
	if (parts.length == 2) {
		let id = parts[0]
		let occurrence = parseInt(parts[1])
		return {
			recurrency: {
				id,
				index: occurrence,
			}
		}
	}
	return {}
}

function buildCarryOverId(date: DateOnly, accountId: string) {
	return `carryover-${date.toYearMonthString()}-${accountId}`
}

export const idb = new IndexedDbWrapper("solid-money")


function seed() {
	const categories: Category[] = [
		{ id: "1", name: "Groceries", icon: "🛒" },
		{ id: "2", name: "Rent", icon: "🏠" },
		{ id: "3", name: "Utilities", icon: "💡" },
		{ id: "4", name: "Transportation", icon: "🚗" },
		{ id: "5", name: "Dining Out", icon: "🍽️" },
		{ id: "6", name: "Entertainment", icon: "🎮" },
		{ id: "7", name: "Health & Fitness", icon: "💪" },
		{ id: "8", name: "Subscriptions", icon: "📦" },
		{ id: "9", name: "Travel", icon: "✈️" },
		{ id: "10", name: "Savings", icon: "💰" }
	];
	for (let category of categories) {
		idb.set("categories", category)
	}


	// Sample seed data for Accounts
	const accounts: Account[] = [
		{ id: "1", name: "Cash", icon: "💵" },
	];
	for (let account of accounts) {
		idb.set("accounts", account)
	}
}



