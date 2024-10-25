type TransactionId = string

export type DbRecordType = "accounts" | "categories" | "transactions" | "carryovers" | "recurrencies"

export const DbRecordTypes = () => ["accounts", "categories", "transactions", "carryovers", "recurrencies"]


export interface DbProfile {
	id: number
	created_by: number
	created_at: Date
}

export interface DbMembership {
	user_id: number
	profile_id: number
	invited_by: number
	admin: boolean
}

export interface DbInvite {
	id: number
	created_by: number
	created_at: Date
	expired_at: Date
	email: string
	accepted: boolean
}

export interface DbRecord {
	id: string
	type: DbRecordType
	profile: number
	created_by: number
	created_at: Date
	updated_at: Date
	updated_by: number
	deleted: boolean
	data: any
}

export interface DbUser {
	id: number
	name: string
	email: string
}

export interface DbSignupToken {
	token: string
	expiration: Date
	created_at: Date
	email: string
}

export interface DbLoginToken {
	token: string
	user_id: number
	expiration: Date
	created_at: Date
}

export interface SignedInUser extends DbUser {
	activeProfile: {
		id: number,
		admin: boolean,
	},
	otherProfiles: {
		id: number,
		admin: boolean,
	}[],
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
	id: string
	accountId: string
	yearMonthIndex: string,
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


