import { Account, Transaction, Category, TransactionWithRefs } from "./models"
import { DateOnly } from "./utils"

type StoreName = "accounts" | "categories" | "transactions"

class IndexedDbWrapper {
	private databaseName: string
	private db?: IDBDatabase
	constructor(databaseName: string) {
		this.databaseName = databaseName
	}

	async getTransactionById(id: string): Promise<TransactionWithRefs> {
		let accounts = await this.getAll<Account>("accounts")
		let categories = await this.getAll<Category>("categories")
		let transaction = await this.get<Transaction>("transactions", id)
		return {
			...transaction,
			account: accounts.find(account => account.id == transaction.accountId)!,
			category: categories.find(category => category.id == transaction.categoryId)!,
		}
	}

	async getTransactionsByMonth(year: number, month: number): Promise<TransactionWithRefs[]> {
		// TODO: order by date from the oldest
		let accounts = await this.getAll<Account>("accounts")
		let categories = await this.getAll<Category>("categories")
		let transactions = await idb.filter<Transaction>(
			"transactions",
			"yearMonthIndex",
			DateOnly.yearMonthString(year, month)
		)
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
				const transactionsStore = db.createObjectStore("transactions", { keyPath: "id" })
				transactionsStore.createIndex("yearMonthIndex", "yearMonthIndex", { unique: false })
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


export const idb = new IndexedDbWrapper("solid-money")

function seed() {
	const accounts: Account[] = [
		{ id: 'acc-001', name: 'Cash', icon: '💵' },
		{ id: 'acc-002', name: 'Checking Account', icon: '🏦' },
		{ id: 'acc-003', name: 'Savings Account', icon: '💰' },
	];

	const categories: Category[] = [
		{ id: 'cat-001', name: 'Groceries', icon: '🥦' },
		{ id: 'cat-002', name: 'Transportation', icon: '🚗' },
		{ id: 'cat-003', name: 'Entertainment', icon: '🎮' },
	];

	const transactions: Transaction[] = [
		{
			id: 'trans-001',
			name: 'Grocery Shopping',
			type: "expense",
			amount: 75.50,
			date: '2024-10-01',
			yearMonthIndex: '2024-10',
			accountId: 'acc-001',
			categoryId: 'cat-001',
		},
		{
			id: 'trans-002',
			name: 'Bus Ticket',
			type: "expense",
			amount: 3.25,
			date: '2024-10-01',
			yearMonthIndex: '2024-10',
			accountId: 'acc-002',
			categoryId: 'cat-002',
		},
		{
			id: 'trans-003',
			name: 'Movie Night',
			type: "expense",
			amount: 15.00,
			date: '2024-10-02',
			yearMonthIndex: '2024-10',
			accountId: 'acc-001',
			categoryId: 'cat-003',
		},
	];

	for (const transaction of transactions) {
		idb.set("transactions", transaction)
	}

	for (const category of categories) {
		idb.set("categories", category)
	}

	for (const account of accounts) {
		idb.set("accounts", account)
	}

}

