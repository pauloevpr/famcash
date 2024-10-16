import { SpendingByCategory, Summary, Transaction, TransactionWithRefs } from "./models";

export const calculator = {
	spendingByCategory(transactions: TransactionWithRefs[]): SpendingByCategory[] {
		let spending: { [id: string]: SpendingByCategory } = {}
		for (let transaction of transactions) {
			if (transaction.type === "carryover") continue
			if (transaction.type === "income") continue
			if (!spending[transaction.categoryId]) {
				spending[transaction.categoryId] = { category: transaction.category, total: 0, transactions: [] }
			}
			spending[transaction.categoryId].total += transaction.amount
			spending[transaction.categoryId].transactions.push(transaction)
		}
		return Object.values(spending)
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
