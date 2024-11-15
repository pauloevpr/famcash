import { DbRecordTypes, IdbRecord, UncheckedFamily, UncheckedUser } from "./models"
import { UnsyncedRecord } from "solid-wire"

export const validate = {
	family(input: UncheckedFamily) {
		this.plainObject(input)
		this.string(input, "name", 2, 64)
		this.string(input, "currency", 3, 3)
	},

	user(user: UncheckedUser) {
		this.plainObject(user)
		this.string(user, "name", 2, 32)
	},

	idbRecord(record: IdbRecord) {
		this.plainObject(record)
		this.string(record, "id", 20, 20)
		this.string(record, "type", 1, 32)
		this.enum(record, "type", DbRecordTypes())
		this.dictionary(record, "data")
	},

	record<TData extends Record<string, any>>(record: UnsyncedRecord<TData>) {
		this.string(record, "id", 20, 20)
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

