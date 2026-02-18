// ============================================================
// OBLICZANIE POLSKICH ŚWIĄT (CLIENT-SIDE)
// ============================================================

interface Holiday {
	date: string; // YYYY-MM-DD
	name: string;
	isMoveable: boolean;
}

// Algorytm Computus - obliczanie daty Wielkanocy
function getEasterDate(year: number): Date {
	const a = year % 19;
	const b = Math.floor(year / 100);
	const c = year % 100;
	const d = Math.floor(b / 4);
	const e = b % 4;
	const f = Math.floor((b + 8) / 25);
	const g = Math.floor((b - f + 1) / 3);
	const h = (19 * a + b - d - g + 15) % 30;
	const i = Math.floor(c / 4);
	const k = c % 4;
	const l = (32 + 2 * e + 2 * i - h - k) % 7;
	const m = Math.floor((a + 11 * h + 22 * l) / 451);
	const month = Math.floor((h + l - 7 * m + 114) / 31);
	const day = ((h + l - 7 * m + 114) % 31) + 1;

	return new Date(year, month - 1, day);
}

function formatDate(date: Date): string {
	return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function getPolishHolidays(year: number): Holiday[] {
	const easter = getEasterDate(year);

	const holidays: Holiday[] = [
		// Święta stałe
		{ date: `${year}-01-01`, name: "Nowy Rok", isMoveable: false },
		{ date: `${year}-01-06`, name: "Trzech Króli", isMoveable: false },
		{ date: `${year}-05-01`, name: "Święto Pracy", isMoveable: false },
		{ date: `${year}-05-03`, name: "Święto Konstytucji 3 Maja", isMoveable: false },
		{ date: `${year}-08-15`, name: "Wniebowzięcie NMP", isMoveable: false },
		{ date: `${year}-11-01`, name: "Wszystkich Świętych", isMoveable: false },
		{ date: `${year}-11-11`, name: "Święto Niepodległości", isMoveable: false },
		{ date: `${year}-12-25`, name: "Boże Narodzenie", isMoveable: false },
		{ date: `${year}-12-26`, name: "Drugi dzień Bożego Narodzenia", isMoveable: false },

		// Święta ruchome
		{ date: formatDate(easter), name: "Wielkanoc", isMoveable: true },
		{
			date: formatDate(addDays(easter, 1)),
			name: "Poniedziałek Wielkanocny",
			isMoveable: true,
		},
		{ date: formatDate(addDays(easter, 49)), name: "Zielone Świątki", isMoveable: true },
		{ date: formatDate(addDays(easter, 60)), name: "Boże Ciało", isMoveable: true },
	];

	return holidays;
}

export function isPolishHoliday(date: Date): boolean {
	const dateStr = formatDate(date);
	const year = date.getFullYear();
	const holidays = getPolishHolidays(year);

	return holidays.some((h) => h.date === dateStr);
}

export function getHolidayName(date: Date): string | null {
	const dateStr = formatDate(date);
	const year = date.getFullYear();
	const holidays = getPolishHolidays(year);

	const holiday = holidays.find((h) => h.date === dateStr);
	return holiday?.name ?? null;
}

export function getTodayHolidayInfo(): { isHoliday: boolean; name: string | null } {
	const today = new Date();
	const name = getHolidayName(today);

	return {
		isHoliday: name !== null,
		name,
	};
}
