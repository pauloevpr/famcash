type TransactionId = string

export interface Transaction {
	id: TransactionId,
	name: string,
	amount: number,
	date: string,
	yearMonthIndex: string,
	accountId: string,
	categoryId: string,
}

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


