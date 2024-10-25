import { DbRecordTypes, DbUser, UncheckedRecord } from "./models"

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

export function generateDbRecordId() {
	const timestamp = new Date().getTime().toString(); // current timestamp
	const randomPart = Math.random().toString(36).substring(2, 10); // 4-char random part
	return (timestamp + randomPart).substring(0, 20); // ensure total length is 20
}

export class ValidationError extends Error {
	constructor(field: any, error: string) {
		super(
			field ? `field '${field}' has error: ${error}` : error
		)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}
	}
}


export const validate = {
	user(user: DbUser) {
		this.plainObject(user)
		this.email(user, "email")
		this.string(user, "name", 2, 32)
	},

	record(record: UncheckedRecord) {
		this.plainObject(record)
		this.string(record, "id", 20, 20)
		this.string(record, "type", 1, 32)
		this.enum(record, "type", DbRecordTypes())
		this.boolean(record, "deleted")
		this.dictionary(record, "data")
		this.serializable(record, "data", 2048)
	},

	serializable<T extends object>(values: T, key: keyof T, limit: number) {
		let input = values[key]
		try {
			let json = JSON.stringify(input)
			if (json.length > limit) {
				throw new ValidationError(key, `resulting json blob would be over the limit of ${limit} chars`)
			}
		} catch {
			throw new ValidationError(key, "not json serializable")
		}
	},

	enum<T extends object>(values: T, key: keyof T, accepted: string[]) {
		let input = `${values[key]}`
		if (!accepted.includes(input)) {
			throw new ValidationError("", "enum mismatch")
		}
	},

	boolean<T extends object>(values: T, key: keyof T) {
		let input = values[key]
		if (typeof input !== "boolean") {
			throw new ValidationError("", "expecting boolean")
		}
	},

	plainObject(input: any) {
		let valid = (
			typeof input === 'object' &&
			input !== null &&
			!Array.isArray(input) &&
			!(input instanceof Date) &&
			!(input instanceof Function)
		);
		if (!valid) {
			throw new ValidationError("", "expecting plain object")
		}
	},

	dictionary<T extends object>(values: T, key: keyof T) {
		let input = values[key]
		this.plainObject(input)
		let stringKeys = Object.keys(input as any).every(key => typeof key === "string")
		if (!stringKeys) {
			throw new ValidationError(key, "all keys must be string")
		}
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
		this.string(values, key, 1, 255)
		let input = values[key]
		if (!input || typeof input !== 'string') {
			throw new ValidationError(key, "required")
		}
		let valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
		if (!valid) throw new ValidationError(key, `invalid email address`)
	},
}

