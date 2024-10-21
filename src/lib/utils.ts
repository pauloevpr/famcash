import { DbUser } from "./models"

export class DateOnly {
	date: Date
	constructor(value: string | Date) {
		if (typeof (value) === "string") {
			this.date = new Date(`${value}T00:00:00`)
		} else {
			this.date = new Date(value)
		}
	}
	get time() {
		return this.date.getTime()
	}
	get year() {
		return this.date.getFullYear()
	}
	get month() {
		return this.date.getMonth() + 1
	}
	static fromYearMonth(year: number, month: number) {
		return new DateOnly(new Date(year, month - 1, 1))
	}
	static yearMonthString(year: number, month: number) {
		let monthStr = String(month).padStart(2, '0');
		return `${year}-${monthStr}`;
	}
	toYearMonthString() {
		const year = this.date.getFullYear();
		const month = String(this.date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
		return `${year}-${month}`;
	}
	toString() {
		const year = this.date.getFullYear();
		const month = String(this.date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-based
		const day = String(this.date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
	addYears(years: number) {
		let result = new Date(this.date);
		result.setFullYear(result.getFullYear() + years)
		return new DateOnly(result);
	}
	addDays(days: number) {
		let result = new Date(this.date);
		result.setDate(result.getDate() + days)
		return new DateOnly(result);
	}
	addMonths(months: number) {
		let result = new Date(this.date);
		result.setMonth(result.getMonth() + months);
		return new DateOnly(result);
	}
}

export class ValidationError extends Error {
	constructor(field: any, error: string) {
		super(`field '${field}' has error: ${error}`)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}


export const validate = {
	user(user: DbUser) {
		this.email(user, "id")
		this.string(user, "nickname", 0, 32)
	},

	string<T extends object>(values: T, key: keyof T, min?: number, max?: number) {
		let input = values[key]
		if (input === undefined || input === null || typeof input !== 'string') {
			throw new ValidationError(key, "required")
		}
		if (min !== undefined && input.length < min) {
			throw new ValidationError(key, `minimum length is ${min}`)
		}
		if (max !== undefined && input.length > max) {
			throw new ValidationError(key, `maximum length is ${max}`)
		}
	},

	email<T extends object>(values: T, key: keyof T) {
		let input = values[key]
		if (!input || typeof input !== 'string') {
			throw new ValidationError(key, "required")
		}
		let valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
		if (!valid) throw new ValidationError(key, `invalid email address`)
	},
}

