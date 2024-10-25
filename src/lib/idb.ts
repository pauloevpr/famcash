import { calculator } from "./calculator"
import { Account, Transaction, Category, TransactionWithRefs, CarryOver, ParsedTransactionId as ParsedTransactionId, DbRecordType } from "./models"
import { DateOnly, generateDbRecordId } from "./utils"

type StoreName = DbRecordType

export type IdbRecord = {
	id: string,
	unsynced?: "true"
	deleted?: "true"
	store: StoreName
	[key: string]: any
}


class Idb {
	private name: string = ""
	private db?: IDBDatabase
	private carryOverCategory: Category = { id: "carryover", name: "Carry Over", icon: "" }
	private subscribers: { [id: string]: Function } = {}

	initialize(databaseName: string) {
		if (this.name) throw Error("idb already initialized")
		this.name = databaseName
	}

	get stores(): StoreName[] {
		return ["accounts", "categories", "transactions", "carryovers", "recurrencies"]
	}

	subscribe(callback: Function) {
		let id = new Date().getTime().toString()
		this.subscribers[id] = callback
		return () => {
			delete this.subscribers[id]
		}
	}

	async getCategories() {
		let categories = (await idb.getAll<Category>("categories")).toSorted()
		categories.sort((a, b) => {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});
		return categories
	}

	async getAccounts() {
		let accounts = (await idb.getAll<Account>("accounts")).toSorted()
		accounts.sort((a, b) => {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});
		return accounts
	}

	async deleteTransaction(id: string) {
		let parsedId = parseTransactionId(id)
		if (parsedId.recurrency) {
			if (parsedId.recurrency.index === 0) {
				await this.delete("recurrencies", parsedId.recurrency.id)
			} else {
				let base = await this.getRequiredRecurrency(parsedId.recurrency.id)
				let occurrence = await this.getOccurrenceByIndex(base, parsedId.recurrency.index)
				base.recurrency!.endDate = occurrence.date
				await this.set("recurrencies", { ...base, id: parsedId.recurrency.id })
			}
		}
		await this.delete("transactions", id)
	}

	async saveTransaction(transaction: Transaction) {
		let parsedId = parseTransactionId(transaction.id)
		if (parsedId.carryOver) {
			let existing = await this.getCarryOver(
				parsedId.carryOver.accountId,
				parsedId.carryOver.year,
				parsedId.carryOver.month
			)
			let carryOver: CarryOver = {
				id: existing?.id || generateDbRecordId(),
				accountId: parsedId.carryOver.accountId,
				yearMonthIndex: DateOnly.fromYearMonth(
					parsedId.carryOver.year,
					parsedId.carryOver.month
				).toYearMonthString(),
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
			if (parsedId.recurrency.index === 0) {
				await this.set("recurrencies", { ...transaction, id: parsedId.recurrency.id })
			} else {
				let base = await this.getRequiredRecurrency(parsedId.recurrency.id)
				let occurrence = await this.getOccurrenceByIndex(base, parsedId.recurrency.index)
				base.recurrency!.endDate = occurrence.date
				await this.set("recurrencies", base)
				transaction.id = generateDbRecordId()
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
			let carryOver = await this.calculateCarryOverRecursively(account, parsedId.carryOver.year, parsedId.carryOver.month, cutoff)
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
			transactions.push(await this.calculateCarryOverRecursively(account, year, month, cutoff))
		}

		return transactions.map<TransactionWithRefs>(transaction => {
			return {
				...transaction,
				account: accounts.find(account => account.id == transaction.accountId)!,
				category: categories.find(category => category.id == transaction.categoryId)!,
			}
		})
	}

	private async getRequiredRecurrency(id: string) {
		let recurrent = await this.get<Transaction>("recurrencies", id)
		if (!recurrent) throw Error(`Recurrency with id '${id}' not found`)
		if (!recurrent.recurrency) throw Error(`Recurrency with id '${id}' is corrupted`)
		return recurrent
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

	private async getCarryOver(accountId: string, year: number, month: number) {
		return (
			await this.filter<CarryOver>(
				"carryovers",
				"yearMonthIndex",
				DateOnly.fromYearMonth(year, month).toYearMonthString()
			)
		).filter(item => item.accountId === accountId)[0]
	}

	private async calculateCarryOverRecursively(account: Account, year: number, month: number, cutoff: DateOnly): Promise<Transaction> {
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

		let manual = await this.getCarryOver(account.id, thisMonth.year, thisMonth.month)
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

			let previousCarryOver = await this.calculateCarryOverRecursively(account, previousMonth.year, previousMonth.month, cutoff)
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
		let firstCarryOver = await this.filterFirst<CarryOver>("carryovers", "yearMonthIndex", null)
		let firstCarryOverDate = firstCarryOver ? new DateOnly(`${firstCarryOver.yearMonthIndex}-01`) : new DateOnly(new Date)
		return [
			firstRecurrencyDate,
			firstTransactionDate,
			firstCarryOverDate
		].sort((a, b) => a.time - b.time)[0]
	}

	private notify() {
		setTimeout(() => {
			for (let sub of Object.values(this.subscribers)) {
				try {
					sub()
				} catch (e) {
					console.error("idb: subscriber threw an exception: ", e)
				}
			}
		}, 1)
	}

	private filterDeleted(...records: any): any[] {
		return records.filter(
			(record: any) => !(typeof record === "object" && "deleted" in record)
		)
	}

	deleteForever(store: StoreName, id: string) {
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


	async delete(store: StoreName, id: string) {
		let d = await this.get(store, id)
		if (!d) return
		let record = {
			id,
			deleted: "true",
		}
		this.set(store, record, false)
	}

	set<T extends Object>(store: StoreName, data: T, synced?: boolean): Promise<void> {
		return new Promise(async (resolve, reject) => {
			const db = await this.open()
			if (!synced) {
				((data as any) as IdbRecord).unsynced = "true"
			}
			const request = db.transaction(store, "readwrite").objectStore(store).put(data)
			request.onsuccess = () => {
				resolve()
				this.notify()
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
				resolve(
					this.filterDeleted(request.result)[0]
				)
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
				resolve(
					this.filterDeleted(...request.result)
				)
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
					resolve(
						this.filterDeleted(cursor.value)[0]
					);
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
				resolve(
					this.filterDeleted(...request.result)
				)
			}
			request.onerror = (e: any) => {
				reject("error when reading data for store " + store + ": " + e.target.error)
			}
		})
	}

	async getUnsynced(): Promise<IdbRecord[]> {
		const db = await this.open()
		let get = async (store: string) => new Promise<IdbRecord[]>(async (resolve, reject) => {
			const request = db.transaction(store, "readonly").objectStore(store).index("unsynced").getAll("true")
			request.onsuccess = () => {
				let records = request.result as any[]
				for (let record of records) {
					record.store = store
				}
				resolve(records)
			}
			request.onerror = (e: any) => {
				reject("error when reading data for store " + store + ": " + e.target.error)
			}
		})
		let all = await Promise.all(
			this.stores.map(store => get(store))
		)
		return all.reduce((mainList, list) => {
			return mainList.concat(list)
		}, [])
	}

	private open() {
		return new Promise<IDBDatabase>((resolve, reject) => {
			if (this.db) {
				resolve(this.db)
				return
			}
			const open = indexedDB.open(this.name, 1)
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
				let accounts = db.createObjectStore("accounts", { keyPath: "id" })
				let categories = db.createObjectStore("categories", { keyPath: "id" })
				let carryovers = db.createObjectStore("carryovers", { keyPath: "id" })
				let transactions = db.createObjectStore("transactions", { keyPath: "id" })
				let recurrencies = db.createObjectStore("recurrencies", { keyPath: "id" })

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
				this.db = undefined
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

export const idb = new Idb()


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



