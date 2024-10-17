import { CategoryWithSpending, Summary, Transaction, TransactionWithRefs } from "./models";

export const calculator = {
	spendingByCategory(transactions: TransactionWithRefs[]): CategoryWithSpending[] {
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
