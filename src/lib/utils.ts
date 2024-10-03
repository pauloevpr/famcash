export class DateOnly {
	date: Date
	constructor(value: string | Date) {
		if (typeof (value) === "string") {
			this.date = new Date(`${value}T00:00:00`)
		} else {
			this.date = new Date(value)
		}
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
	addMonths(months: number) {
		let result = new Date(this.date);
		result.setMonth(result.getMonth() + months);
		return result;
	}
}

