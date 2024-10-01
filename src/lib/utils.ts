export const dateHelper = {
	addMonths(date: Date, months: number) {
		let result = new Date(date);
		result.setMonth(result.getMonth() + months);
		return result;
	}
}
