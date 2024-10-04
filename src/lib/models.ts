type TransactionId = string

export interface Summary {
	total: number
	totalExpense: number
	totalIncome: number
	carryOver: number
}

export interface CarryOver {
	id: string // year-month-accoundId - e.g. 2024-10-accc1
	amount: number
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
export type TransactionType = "expense" | "income" | "carryover"

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


