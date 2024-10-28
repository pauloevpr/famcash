import { Idb, IdbRecord } from "./idb";
import { CategoryWithSpending, CurrentFamily, CurrentUser, Summary } from "./models";
import { Account, Transaction, Category, TransactionWithRefs, CarryOver, ParsedTransactionId as ParsedTransactionId } from "./models"
import { DateOnly, generateDbRecordId } from "./utils"

// TODO: move wrapper functions from idb to this store;
// then change all callers to use this store instead of the idb directly


export function createStore(user: CurrentUser, family: CurrentFamily) {
	let idb = new Idb(`${user.id}:${family.id}`)
	let carryOverCategory: Category = { id: "carryover", name: "Carry Over", icon: "" }

	function calculateSpendingByCategory(transactions: TransactionWithRefs[]): CategoryWithSpending[] {
		let category: { [id: string]: CategoryWithSpending } = {}
		for (let transaction of transactions) {
			if (transaction.type === "carryover") continue
			if (transaction.type === "income") continue
			if (!category[transaction.categoryId]) {
				category[transaction.categoryId] = {
					...transaction.category,
					total: 0,
					remaining: 0,
					transactions: []
				}
			}
			let planned = transaction.category.plan?.limit ?? 0
			category[transaction.categoryId].total += transaction.amount
			category[transaction.categoryId].transactions.push(transaction)
			category[transaction.categoryId].remaining = planned - category[transaction.categoryId].total
		}
		return Object.values(category)
	}

	function calculateSummary(transactions: Transaction[]): Summary {
		let summary: Summary = {
			total: 0,
			totalExpense: 0,
			totalIncome: 0,
			carryOver: 0,
		}
		for (let t of transactions) {
			if (t.type === "income") {
				summary.totalIncome += t.amount
				summary.total += t.amount
			}
			if (t.type === "expense") {
				summary.totalExpense += t.amount
				summary.total -= t.amount
			}
			if (t.type === "carryover") {
				summary.carryOver += t.amount
				summary.total += t.amount
			}
		}
		return summary
	}

	async function getUnsynced(): Promise<IdbRecord[]> {
		const db = await idb.open()
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
			["accounts", "categories", "transactions", "carryovers", "recurrencies"]
				.map(store => get(store))
		)
		return all.reduce((mainList, list) => {
			return mainList.concat(list)
		}, [])
	}

	function parseTransactionId(id: string): ParsedTransactionId {
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

	async function deleteAccount(id: string) {
		await idb.delete("accounts", id)
	}

	async function getAccount(id: string) {
		return await idb.get<Account>("accounts", id)
	}

	async function getCategory(id: string) {
		return await idb.get<Category>("categories", id)

	}

	async function deleteCategory(id: string) {
		await idb.delete("categories", id)
	}

	async function getCategories() {
		let categories = (await idb.getAll<Category>("categories")).toSorted()
		categories.sort((a, b) => {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});
		return categories
	}

	async function getAccounts() {
		let accounts = (await idb.getAll<Account>("accounts")).toSorted()
		accounts.sort((a, b) => {
			if (a.name < b.name) return -1;
			if (a.name > b.name) return 1;
			return 0;
		});
		return accounts
	}

	async function deleteTransaction(id: string) {
		let parsedId = parseTransactionId(id)
		if (parsedId.recurrency) {
			if (parsedId.recurrency.index === 0) {
				await idb.delete("recurrencies", parsedId.recurrency.id)
			} else {
				let base = await getRequiredRecurrency(parsedId.recurrency.id)
				let occurrence = await getOccurrenceByIndex(base, parsedId.recurrency.index)
				base.recurrency!.endDate = occurrence.date
				await idb.set("recurrencies", { ...base, id: parsedId.recurrency.id })
			}
		}
		await idb.delete("transactions", id)
	}

	async function saveAccount(account: Account) {
		await idb.set("accounts", account)
	}

	async function saveCategory(category: Category) {
		await idb.set("categories", category)
	}

	async function saveTransaction(transaction: Transaction) {
		let parsedId = parseTransactionId(transaction.id)
		if (parsedId.carryOver) {
			let existing = await getCarryOver(
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
			await idb.set("carryovers", carryOver)
		} else if (parsedId.recurrency || transaction.recurrency) {
			saveRecurrentTransaction(transaction, parsedId)
		} else {
			await idb.set("transactions", transaction)
		}
	}

	async function saveRecurrentTransaction(transaction: Transaction, parsedId: ParsedTransactionId) {
		if (parsedId.recurrency) {
			if (parsedId.recurrency.index === 0) {
				await idb.set("recurrencies", { ...transaction, id: parsedId.recurrency.id })
			} else {
				let base = await getRequiredRecurrency(parsedId.recurrency.id)
				let occurrence = await getOccurrenceByIndex(base, parsedId.recurrency.index)
				base.recurrency!.endDate = occurrence.date
				await idb.set("recurrencies", base)
				transaction.id = generateDbRecordId()
				await idb.set("recurrencies", transaction)
			}
		} else {
			await idb.set("recurrencies", transaction)
		}
	}

	async function getRecurrencies() {
		return await idb.getAll<Transaction>("recurrencies")
	}

	async function getTransactions() {
		return await idb.getAll<Transaction>("transactions")
	}

	async function getTransactionById(id: string): Promise<TransactionWithRefs> {
		let parsedId = parseTransactionId(id)
		if (parsedId.carryOver) {
			let account = await idb.get<Account>("accounts", parsedId.carryOver.accountId)
			if (!account) throw Error(`invalid carryover id '${id}': account not found`)
			let cutoff = await getCutoffDate()
			let carryOver = await calculateCarryOverRecursively(account, parsedId.carryOver.year, parsedId.carryOver.month, cutoff)
			return {
				...carryOver,
				account: account,
				category: carryOverCategory,
			}
		}
		let accounts = await idb.getAll<Account>("accounts")
		let categories = await idb.getAll<Category>("categories")
		let transaction: Transaction
		if (parsedId.recurrency) {
			let recurrent = await idb.get<Transaction>("recurrencies", parsedId.recurrency.id)
			if (!recurrent) throw Error(`invalid recurrency id '${id}': recurrency not found`)
			transaction = await getOccurrenceByIndex(recurrent, parsedId.recurrency.index)
		} else {
			transaction = await idb.get<Transaction>("transactions", id)
		}

		return {
			...transaction,
			account: accounts.find(account => account.id == transaction.accountId)!,
			category: categories.find(category => category.id == transaction.categoryId)!,
		}
	}

	async function getTransactionsByMonth(year: number, month: number): Promise<TransactionWithRefs[]> {
		// TODO: order by date from the oldest
		let cutoff = await getCutoffDate()
		let accounts = await idb.getAll<Account>("accounts")
		let categories = await idb.getAll<Category>("categories")
		categories.push({ ...carryOverCategory })

		let transactions = await idb.filter<Transaction>(
			"transactions",
			"yearMonthIndex",
			DateOnly.yearMonthString(year, month)
		)

		let recurrent = await getRecurrentTransactionsByMonth(year, month)
		transactions.push(...recurrent)

		for (let account of accounts) {
			transactions.push(await calculateCarryOverRecursively(account, year, month, cutoff))
		}

		return transactions.map<TransactionWithRefs>(transaction => {
			return {
				...transaction,
				account: accounts.find(account => account.id == transaction.accountId)!,
				category: categories.find(category => category.id == transaction.categoryId)!,
			}
		})
	}

	async function getRequiredRecurrency(id: string) {
		let recurrent = await idb.get<Transaction>("recurrencies", id)
		if (!recurrent) throw Error(`Recurrency with id '${id}' not found`)
		if (!recurrent.recurrency) throw Error(`Recurrency with id '${id}' is corrupted`)
		return recurrent
	}

	async function getOccurrenceByIndex(transaction: Transaction, index: number): Promise<Transaction> {
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

	async function getRecurrentTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
		let start = DateOnly.fromYearMonth(year, month)
		let end = start.addMonths(1).addDays(-1)
		let transactions: Transaction[] = []
		let recurrencies = await idb.getAll<Transaction>("recurrencies")
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

	async function getCarryOver(accountId: string, year: number, month: number) {
		return (
			await idb.filter<CarryOver>(
				"carryovers",
				"yearMonthIndex",
				DateOnly.fromYearMonth(year, month).toYearMonthString()
			)
		).filter(item => item.accountId === accountId)[0]
	}

	async function calculateCarryOverRecursively(account: Account, year: number, month: number, cutoff: DateOnly): Promise<Transaction> {
		let thisMonth = DateOnly.fromYearMonth(year, month)
		let id = buildCarryOverId(thisMonth, account.id)
		let carryover: Transaction = {
			id: id,
			type: "carryover",
			name: `Carry Over ${account.name}`,
			date: `${thisMonth.toYearMonthString()}-01`,
			yearMonthIndex: thisMonth.toYearMonthString(),
			accountId: account.id,
			categoryId: carryOverCategory.id,
			amount: 0,
		}
		if (thisMonth.date.getTime() < cutoff.date.getTime()) {
			return carryover
		}

		let manual = await getCarryOver(account.id, thisMonth.year, thisMonth.month)
		if (manual) {
			carryover.amount = manual.amount
		} else {
			let previousMonth = thisMonth.addMonths(-1)
			let previousTransactions = (await idb.filter<Transaction>(
				"transactions",
				"yearMonthIndex",
				previousMonth.toYearMonthString(),
			)).filter(transaction => transaction.accountId === account.id)

			let previousRecurrencies = (await getRecurrentTransactionsByMonth(
				previousMonth.year,
				previousMonth.month
			)).filter(transaction => transaction.accountId === account.id)
			previousTransactions.push(...previousRecurrencies)

			let previousCarryOver = await calculateCarryOverRecursively(account, previousMonth.year, previousMonth.month, cutoff)
			previousTransactions.push(previousCarryOver)

			carryover.amount = calculateSummary(previousTransactions).total
		}
		return carryover
	}

	async function getCutoffDate() {
		let firstRecurrency = await idb.filterFirst<Transaction>("recurrencies", "dateIndex", null)
		let firstRecurrencyDate = new DateOnly(firstRecurrency?.date || new Date())
		let firstTransaction = await idb.filterFirst<Transaction>("transactions", "dateIndex", null)
		let firstTransactionDate = new DateOnly(firstTransaction?.date || new Date())
		let firstCarryOver = await idb.filterFirst<CarryOver>("carryovers", "yearMonthIndex", null)
		let firstCarryOverDate = firstCarryOver ? new DateOnly(`${firstCarryOver.yearMonthIndex}-01`) : new DateOnly(new Date)
		return [
			firstRecurrencyDate,
			firstTransactionDate,
			firstCarryOverDate
		].sort((a, b) => a.time - b.time)[0]
	}

	return {
		idb,
		category: {
			getAll: getCategories,
			get: getCategory,
			delete: deleteCategory,
			save: saveCategory,
		},
		account: {
			delete: deleteAccount,
			getAll: getAccounts,
			get: getAccount,
			save: saveAccount,
		},
		transaction: {
			delete: deleteTransaction,
			save: saveTransaction,
			get: getTransactionById,
			getByMonth: getTransactionsByMonth,
			getAll: getTransactions,
		},
		recurrency: {
			getAll: getRecurrencies,
		},
		getUnsynced,
		calculateSpendingByCategory,
		calculateSummary,
		parseTransactionId,
	}
}
