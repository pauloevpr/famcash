type TransactionId = string

export interface Summary {
	total: number
	totalExpense: number
	totalIncome: number
	carryOver: number
}

export interface Transaction {
	id: TransactionId,
	type: TransactionType
	name: string,
	amount: number,
	date: string,
	yearMonthIndex: string,
	accountId: string,
	categoryId: string,
}
export type TransactionType = "expense" | "income"

export interface TransactionWithRefs extends Transaction {
	account: Account
	category: Category
}

export interface Category {
	id: string,
	name: string,
	icon: string,
}

export interface Account {
	id: string,
	name: string,
	icon: string,
}


