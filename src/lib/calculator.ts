import { Summary, Transaction } from "./models";
import { DateOnly } from "./utils";

export const calculator = {
	nextOccurrences(transaction: Transaction, start: DateOnly, end: DateOnly): Transaction[] {
		if (end.time < start.time) throw Error(`start date '${start}' should be before end date '${end}'`)
		if (!transaction.recurrency) throw Error(`transaction ${transaction.id} is not a recurrent transaction`)
		let result: Transaction[] = []
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
				result.push(occurrence)
			}
		}
		return result
	},
	summary(transactions: Transaction[]): Summary {
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
}
