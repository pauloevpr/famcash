type TransactionId = string


export interface DbRecord {
	id: string
	type: DbRecordType
	user_id: string
	created_at: Date
	updated_at: Date
	deleted: boolean
	data: any
}

export type DbRecordType = "accounts" | "categories" | "transactions" | "carryovers" | "recurrencies"
export const DbRecordTypes = () => ["accounts", "categories", "transactions", "carryovers", "recurrencies"]

export interface DbUser {
	id: string // email
	name: string
}

export interface DbUserToken {
	token: string
	user_id: string
	expiration: Date
	created_at: Date
}

export interface UncheckedRecord {
	id: string
	type: DbRecordType
	deleted: boolean
	data: { [key: string]: any }
}

export interface CategoryWithSpending extends Category {
	total: number
	remaining: number
	transactions: Transaction[]
}

export interface Summary {
	total: number
	totalExpense: number
	totalIncome: number
	carryOver: number
}


export interface ParsedTransactionId {
	carryOver?: {
		year: number
		month: number
		accountId: string
	}
	recurrency?: {
		id: string
		index: number
	}
}

export type RecurrencyInterval = "month" | "week" | "year"

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
	recurrency?: {
		multiplier: number
		interval: RecurrencyInterval
		endDate?: string
	}
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
	plan?: {
		limit: number
	}
}

export interface Account {
	id: string,
	name: string,
	icon: string,
}


