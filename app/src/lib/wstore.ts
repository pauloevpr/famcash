import { CarryOver, Category, CategoryWithSpending, ParsedTransactionId, Summary, Transaction, TransactionWithRefs } from "./models";
import { DateOnly, generateDbRecordId, } from "./utils";
import { db } from "./db";
import { getCurrentAccount } from "./server";
import { validate } from "./utils";
import { createWireStore, SyncedRecord, validateRecordsMetadata } from "solid-wire";


export const store = createWireStore({
	name: "famcash",
	definition: {
		categories: {} as Category,
		transactions: {} as Transaction,
		recurrencies: {} as Transaction,
		carryovers: {} as CarryOver,
	},
	sync: async ({ records, namespace, syncCursor: syncTimestampRaw }) => {
		"use server"
		records = validateRecordsMetadata(records, store.types())
		let familyId = parseInt(namespace)
		let { user } = await getCurrentAccount()
		await db.member.assureExists(user.id, familyId)
		let syncTimestamp = new Date(syncTimestampRaw || '2000-01-01')
		if (isNaN(syncTimestamp.getTime())) {
			let e = `parsing timestamp with value '${syncTimestampRaw}' failed`
			console.error(e)
			throw Error(e)
		}
		// TODO: fix: this is silly, we should make a single call to the database
		for (let record of records) {
			validate.record(record)
			await db.record.upsert(
				familyId,
				user.id,
				record.id,
				record.type,
				record.state === "deleted",
				record.data,
			)
		}
		let updated = await db.record.upatedSince(familyId, syncTimestamp)
		let timestamp = updated[0]?.updated_at || syncTimestamp
		let synced = updated.map<SyncedRecord>(record => ({
			id: record.id,
			type: record.type,
			state: record.deleted ? "deleted" : "updated",
			data: record.data,
		}))
		return {
			records: synced,
			syncCursor: timestamp.toISOString()
		}
	},
	extend: (store) => {
		let carryOverCategory: Category = { id: "carryover", name: "Carry Over", icon: "" }
		let incomeCategory: Category = { id: "income", name: "Income", icon: "" }

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

		function calculateSummary(year: number, month: number, transactions: Transaction[], categories: Category[]): Summary {
			let summary: Summary = {
				total: 0,
				totalExpenses: 0,
				totalIncome: 0,
				carryOver: 0,
				plannedExpenses: 0,
			}
			for (let t of transactions) {
				if (t.type === "income") {
					summary.totalIncome += t.amount
					summary.total += t.amount
				}
				if (t.type === "expense") {
					summary.totalExpenses += t.amount
					summary.total -= t.amount
				}
				if (t.type === "carryover") {
					summary.carryOver += t.amount
					summary.total += t.amount
				}
			}
			let pastMonth = new Date()
			pastMonth.setDate(-1)
			let isUpcomingMonth = DateOnly.fromYearMonth(year, month).time > pastMonth.getTime()
			if (isUpcomingMonth) {
				// TODO: now that data is no longer in memory, this call has become inneficient
				let plannedExpenses = categories.reduce((sum, current) => ((current.plan?.limit || 0) + sum), 0)
				if (plannedExpenses > summary.totalExpenses) {
					summary.total = summary.total + summary.totalExpenses
					summary.total -= plannedExpenses
					summary.plannedExpenses = plannedExpenses
				}
			}
			return summary
		}

		function parseTransactionId(id: string): ParsedTransactionId {
			if (id.startsWith("carryover")) {
				let result = /^carryover-(\d{4})-(\d{2})$/.exec(id)
				if (result?.length != 3) throw Error("invalid carryover id")
				let year = parseInt(result[1])
				if (isNaN(year)) throw Error("invalid carryover id")
				let month = parseInt(result[2])
				if (isNaN(month)) throw Error("invalid carryover id")
				return {
					carryOver: {
						year: year,
						month: month
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

		function buildCarryOverId(date: DateOnly) {
			return `carryover-${date.toYearMonthString()}`
		}

		async function getCategoriesOrdered() {
			let categories = await store.categories.all()
			categories.sort((a, b) => {
				if (a.name < b.name) return -1;
				if (a.name > b.name) return 1;
				return 0;
			});
			return categories
		}

		async function deleteTransaction(id: string) {
			let parsedId = parseTransactionId(id)
			if (parsedId.recurrency) {
				if (parsedId.recurrency.index === 0) {
					await store.recurrencies.delete(parsedId.recurrency.id)
				} else {
					let base = await getRequiredRecurrency(parsedId.recurrency.id)
					let occurrence = getOccurrenceByIndex(base, parsedId.recurrency.index)
					base.recurrency!.endDate = occurrence.date
					await store.recurrencies.set(parsedId.recurrency.id, { ...base })
				}
			}
			await store.transactions.delete(id)
		}

		async function saveTransaction(transaction: Transaction) {
			let parsedId = parseTransactionId(transaction.id)
			if (parsedId.carryOver) {
				let existing = await getCarryOver(
					parsedId.carryOver.year,
					parsedId.carryOver.month
				)
				let carryOver: CarryOver = {
					id: existing?.id || generateDbRecordId(),
					yearMonthIndex: DateOnly.fromYearMonth(
						parsedId.carryOver.year,
						parsedId.carryOver.month
					).toYearMonthString(),
					amount: transaction.amount
				}
				await store.carryovers.set(carryOver.id, carryOver)
			} else if (parsedId.recurrency || transaction.recurrency) {
				saveRecurrentTransaction(transaction, parsedId)
			} else {
				await store.transactions.set(transaction.id, transaction)
			}
		}

		async function saveRecurrentTransaction(transaction: Transaction, parsedId: ParsedTransactionId) {
			if (parsedId.recurrency) {
				if (parsedId.recurrency.index === 0) {
					await store.recurrencies.set(parsedId.recurrency.id, { ...transaction })
				} else {
					let base = await getRequiredRecurrency(parsedId.recurrency.id)
					let occurrence = getOccurrenceByIndex(base, parsedId.recurrency.index)
					base.recurrency!.endDate = occurrence.date
					await store.recurrencies.set(base.id, base)
					transaction.id = generateDbRecordId()
					await store.recurrencies.set(transaction.id, transaction)
				}
			} else {
				await store.recurrencies.set(transaction.id, transaction)
			}
		}

		async function getTransactionWithRefs(id: string): Promise<TransactionWithRefs> {
			let parsedId = parseTransactionId(id)
			if (parsedId.carryOver) {
				let categories = await store.categories.all()
				let cutoff = await getCutoffDate()
				let carryOver = await calculateCarryOverRecursively(parsedId.carryOver.year, parsedId.carryOver.month, cutoff, categories)
				return {
					...carryOver,
					category: carryOverCategory,
				}
			}
			let categories = await store.categories.all()
			let transaction: Transaction | undefined
			if (parsedId.recurrency) {
				let recurrent = await store.recurrencies.get(parsedId.recurrency.id)
				if (!recurrent) throw Error(`invalid recurrency id '${id}': recurrency not found`)
				transaction = getOccurrenceByIndex(recurrent, parsedId.recurrency.index)
			} else {
				transaction = await store.transactions.get(id)
			}

			if (!transaction) throw Error(`transaction ${id} not found`)

			return {
				...transaction,
				category: categories.find(category => category.id == transaction.categoryId)!,
			}
		}

		async function getTransactionsByMonth(year: number, month: number): Promise<TransactionWithRefs[]> {
			// TODO: order by date from the oldest
			let cutoff = await getCutoffDate()
			let categories = await store.categories.all()
			categories.push({ ...carryOverCategory })
			categories.push({ ...incomeCategory })

			let transactions = (
				await store.transactions.all()
			).filter(
				item => item.yearMonthIndex === DateOnly.yearMonthString(year, month)
			)

			let recurrent = await getRecurrentTransactionsByMonth(year, month)
			transactions.push(...recurrent)

			let carryOver = await calculateCarryOverRecursively(year, month, cutoff, categories)
			transactions.push(carryOver)

			let items = transactions.map<TransactionWithRefs>(transaction => {
				return {
					...transaction,
					category: categories.find(category => category.id == transaction.categoryId)!,
				}
			})
			return items
		}

		async function getRequiredRecurrency(id: string) {
			let recurrent = await store.transactions.get(id)
			if (!recurrent) throw Error(`Recurrency with id '${id}' not found`)
			if (!recurrent.recurrency) throw Error(`Recurrency with id '${id}' is corrupted`)
			return recurrent
		}

		function getOccurrenceByIndex(transaction: Transaction, index: number): Transaction {
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
			let recurrencies = await store.recurrencies.all()
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

		async function getCarryOver(year: number, month: number) {
			return (
				await store.carryovers.all()
			).filter(item =>
				item.yearMonthIndex === DateOnly.fromYearMonth(year, month).toYearMonthString()
			)[0]
		}

		async function calculateCarryOverRecursively(year: number, month: number, cutoff: DateOnly, categories: Category[]): Promise<Transaction> {
			let thisMonth = DateOnly.fromYearMonth(year, month)
			let id = buildCarryOverId(thisMonth)
			let carryover: Transaction = {
				id: id,
				type: "carryover",
				name: `Carry Over`,
				date: `${thisMonth.toYearMonthString()}-01`,
				yearMonthIndex: thisMonth.toYearMonthString(),
				categoryId: carryOverCategory.id,
				amount: 0,
				carryOver: {
					type: "auto"
				}
			}
			if (thisMonth.date.getTime() < cutoff.date.getTime()) {
				return carryover
			}

			let manual = await getCarryOver(thisMonth.year, thisMonth.month)
			if (manual) {
				carryover.amount = manual.amount
				carryover.carryOver = { type: "manual" }
			} else {
				let previousMonth = thisMonth.addMonths(-1)
				let previousTransactions = (
					await store.transactions.all()
				).filter(transaction =>
					transaction.yearMonthIndex === previousMonth.toYearMonthString()
				)

				let previousRecurrencies = await getRecurrentTransactionsByMonth(previousMonth.year, previousMonth.month)
				previousTransactions.push(...previousRecurrencies)

				let previousCarryOver = await calculateCarryOverRecursively(previousMonth.year, previousMonth.month, cutoff, categories)
				previousTransactions.push(previousCarryOver)

				let summary = calculateSummary(previousMonth.year, previousMonth.month, previousTransactions, categories)
				carryover.amount = summary.total
			}
			return carryover
		}

		async function getCutoffDate() {
			// TODO: now that data is no longer kept in memory, this has become very inneficient
			let getFirstTransction = (transactions: Transaction[]) => {
				return transactions.sort(
					(a, b) => new DateOnly(a.date).time - new DateOnly(b.date).time
				)[0];
			}
			let getFirstCarryOver = (carryovers: CarryOver[]) => {
				return carryovers.sort(
					(a, b) => new DateOnly(`${a.yearMonthIndex}-01`).time - new DateOnly(`${b.yearMonthIndex}-01`).time
				)[0];
			}
			let firstRecurrency = getFirstTransction(await store.recurrencies.all())
			let firstRecurrencyDate = new DateOnly(firstRecurrency?.date || new Date())
			let firstTransaction = getFirstTransction(await store.transactions.all())
			let firstTransactionDate = new DateOnly(firstTransaction?.date || new Date())
			let firstCarryOver = getFirstCarryOver(await store.carryovers.all())
			let firstCarryOverDate = firstCarryOver ? new DateOnly(`${firstCarryOver.yearMonthIndex}-01`) : new DateOnly(new Date)
			return [
				firstRecurrencyDate,
				firstTransactionDate,
				firstCarryOverDate
			].sort((a, b) => a.time - b.time)[0]
		}

		return {
			categories: {
				all: getCategoriesOrdered,
				static: {
					income: (() => incomeCategory),
					carryover: (() => carryOverCategory),
				},
			},
			transactions: {
				delete: deleteTransaction,
				set: saveTransaction,
				get: getTransactionWithRefs,
				byMonth: getTransactionsByMonth,
			},
			calculateSpendingByCategory,
			calculateSummary,
			parseTransactionId,
		}
	}
})

