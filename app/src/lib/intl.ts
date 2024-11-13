
export function useFormatter(currencyCode: string) {
	let numberFormatter = Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: currencyCode,
		currencyDisplay: "narrowSymbol",
		// minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})
	let numberFormatterShort = Intl.NumberFormat(undefined, {
		style: 'currency',
		currency: currencyCode,
		currencyDisplay: "narrowSymbol",
		// minimumFractionDigits: 2,
		maximumFractionDigits: 0
	})

	function currency(value: number) {
		return numberFormatter.format(value)
	}
	function currencyShort(value: number) {
		return numberFormatterShort.format(value)
	}

	return {
		currency,
		currencyShort
	}
}


export const currencies: Record<string, string> = {
	"AED": "UAE Dirham",
	"AFN": "Afghani",
	"ALL": "Lek",
	"AMD": "Armenian Dram",
	"ANG": "Netherlands Antillian Guilder",
	"AOA": "Kwanza",
	"ARS": "Argentine Peso",
	"AUD": "Australian Dollar",
	"AWG": "Aruban Guilder",
	"AZN": "Azerbaijanian Manat",
	"BAM": "Convertible Marks",
	"BBD": "Barbados Dollar",
	"BDT": "Taka",
	"BGN": "Bulgarian Lev",
	"BHD": "Bahraini Dinar",
	"BIF": "Burundi Franc",
	"BMD": "Bermudian Dollar (customarily known as Bermuda Dollar)",
	"BND": "Brunei Dollar",
	"BOV": "Boliviano Mvdol",
	"BOB": "Boliviano Mvdol",
	"BRL": "Brazilian Real",
	"BSD": "Bahamian Dollar",
	"BTN": "Indian Rupee Ngultrum",
	"BWP": "Pula",
	"BYR": "Belarussian Ruble",
	"BZD": "Belize Dollar",
	"CAD": "Canadian Dollar",
	"CDF": "Congolese Franc",
	"CHF": "Swiss Franc",
	"CLF": "Chilean Peso Unidades de fomento",
	"CLP": "Chilean Peso Unidades de fomento",
	"CNY": "Yuan Renminbi",
	"COU": "Colombian Peso Unidad de Valor Real",
	"COP": "Colombian Peso Unidad de Valor Real",
	"CRC": "Costa Rican Colon",
	"CUC": "Cuban Peso Peso Convertible",
	"CUP": "Cuban Peso Peso Convertible",
	"CVE": "Cape Verde Escudo",
	"CZK": "Czech Koruna",
	"DJF": "Djibouti Franc",
	"DKK": "Danish Krone",
	"DOP": "Dominican Peso",
	"DZD": "Algerian Dinar",
	"EEK": "Kroon",
	"EGP": "Egyptian Pound",
	"ERN": "Nakfa",
	"ETB": "Ethiopian Birr",
	"EUR": "Euro",
	"FJD": "Fiji Dollar",
	"FKP": "Falkland Islands Pound",
	"GBP": "Pound Sterling",
	"GEL": "Lari",
	"GHS": "Cedi",
	"GIP": "Gibraltar Pound",
	"GMD": "Dalasi",
	"GNF": "Guinea Franc",
	"GTQ": "Quetzal",
	"GYD": "Guyana Dollar",
	"HKD": "Hong Kong Dollar",
	"HNL": "Lempira",
	"HRK": "Croatian Kuna",
	"HTG": "Gourde US Dollar",
	"HUF": "Forint",
	"IDR": "Rupiah",
	"ILS": "New Israeli Sheqel",
	"INR": "Indian Rupee",
	"IQD": "Iraqi Dinar",
	"IRR": "Iranian Rial",
	"ISK": "Iceland Krona",
	"JMD": "Jamaican Dollar",
	"JOD": "Jordanian Dinar",
	"JPY": "Yen",
	"KES": "Kenyan Shilling",
	"KGS": "Som",
	"KHR": "Riel",
	"KMF": "Comoro Franc",
	"KPW": "North Korean Won",
	"KRW": "Won",
	"KWD": "Kuwaiti Dinar",
	"KYD": "Cayman Islands Dollar",
	"KZT": "Tenge",
	"LAK": "Kip",
	"LBP": "Lebanese Pound",
	"LKR": "Sri Lanka Rupee",
	"LRD": "Liberian Dollar",
	"LSL": "Rand Loti",
	"LTL": "Lithuanian Litas",
	"LVL": "Latvian Lats",
	"LYD": "Libyan Dinar",
	"MAD": "Moroccan Dirham",
	"MDL": "Moldovan Leu",
	"MGA": "Malagasy Ariary",
	"MKD": "Denar",
	"MMK": "Kyat",
	"MNT": "Tugrik",
	"MOP": "Pataca",
	"MRO": "Ouguiya",
	"MUR": "Mauritius Rupee",
	"MVR": "Rufiyaa",
	"MWK": "Kwacha",
	"MXV": "Mexican Peso Mexican Unidad de Inversion (UDI)",
	"MXN": "Mexican Peso Mexican Unidad de Inversion (UDI)",
	"MYR": "Malaysian Ringgit",
	"MZN": "Metical",
	"NGN": "Naira",
	"NAD": "Rand Namibia Dollar",
	"NIO": "Cordoba Oro",
	"NOK": "Norwegian Krone",
	"NPR": "Nepalese Rupee",
	"NZD": "New Zealand Dollar",
	"OMR": "Rial Omani",
	"PAB": "Balboa US Dollar",
	"PEN": "Nuevo Sol",
	"PGK": "Kina",
	"PHP": "Philippine Peso",
	"PKR": "Pakistan Rupee",
	"PLN": "Zloty",
	"PYG": "Guarani",
	"QAR": "Qatari Rial",
	"RON": "New Leu",
	"RSD": "Serbian Dinar",
	"RUB": "Russian Ruble",
	"RWF": "Rwanda Franc",
	"SAR": "Saudi Riyal",
	"SBD": "Solomon Islands Dollar",
	"SCR": "Seychelles Rupee",
	"SDG": "Sudanese Pound",
	"SEK": "Swedish Krona",
	"SGD": "Singapore Dollar",
	"SHP": "Saint Helena Pound",
	"SLL": "Leone",
	"SOS": "Somali Shilling",
	"SRD": "Surinam Dollar",
	"STD": "Dobra",
	"SVC": "El Salvador Colon US Dollar",
	"SYP": "Syrian Pound",
	"SZL": "Lilangeni",
	"THB": "Baht",
	"TJS": "Somoni",
	"TMT": "Manat",
	"TND": "Tunisian Dinar",
	"TOP": "Pa'anga",
	"TRY": "Turkish Lira",
	"TTD": "Trinidad and Tobago Dollar",
	"TWD": "New Taiwan Dollar",
	"TZS": "Tanzanian Shilling",
	"UAH": "Hryvnia",
	"UGX": "Uganda Shilling",
	"USD": "US Dollar",
	"UYU": "Peso Uruguayo Uruguay Peso en Unidades Indexadas",
	"UYI": "Peso Uruguayo Uruguay Peso en Unidades Indexadas",
	"UZS": "Uzbekistan Sum",
	"VEF": "Bolivar Fuerte",
	"VND": "Dong",
	"VUV": "Vatu",
	"WST": "Tala",
	"XAF": "CFA Franc BEAC",
	"XAG": "Silver",
	"XAU": "Gold",
	"XBA": "Bond Markets Units European Composite Unit (EURCO)",
	"XBB": "European Monetary Unit (E.M.U.-6)",
	"XBC": "European Unit of Account 9(E.U.A.-9)",
	"XBD": "European Unit of Account 17(E.U.A.-17)",
	"XCD": "East Caribbean Dollar",
	"XDR": "SDR",
	"XFU": "UIC-Franc",
	"XOF": "CFA Franc BCEAO",
	"XPD": "Palladium",
	"XPF": "CFP Franc",
	"XPT": "Platinum",
	"XTS": "Codes specifically reserved for testing purposes",
	"YER": "Yemeni Rial",
	"ZAR": "Rand",
	"ZMK": "Zambian Kwacha",
	"ZWL": "Zimbabwe Dollar"
}