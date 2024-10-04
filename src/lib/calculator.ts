import { Summary, Transaction } from "./models";

export const calculator = {
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
				if (t.amount < 0) {
					summary.totalExpense += (t.amount * -1)
				} else {
					summary.totalIncome += t.amount
				}
				summary.total += t.amount
			}
		}
		return summary
	}
}
