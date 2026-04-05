import {
	VALIDATION_LIMITS,
	VALID_DAYS,
	VALID_REPORT_REASONS,
	UUID_REGEX,
	TIME_REGEX,
	type ValidDay,
	type ValidReportReason,
} from "./constants";

export type ValidationResult = { valid: true } | { valid: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function sanitizeString(str: string, maxLength: number): string {
	return str.trim().slice(0, maxLength);
}

export function isValidUUID(str: string): boolean {
	return UUID_REGEX.test(str);
}

// ─── Carrier ──────────────────────────────────────────────────────────────────

interface CarrierData {
	isNew: boolean;
	id?: string;
	name?: string;
}

export function validateCarrierData(data: CarrierData): ValidationResult {
	if (!data.isNew) return { valid: true };

	const name = (data.name ?? "").trim();
	const { min, max } = VALIDATION_LIMITS.CARRIER_NAME;

	if (name.length < min || name.length > max) {
		return { valid: false, error: `Carrier name must be ${min}-${max} characters` };
	}

	return { valid: true };
}

// ─── Line ─────────────────────────────────────────────────────────────────────

interface LineData {
	isNew: boolean;
	id?: string;
	number?: string;
	description?: string;
}

export function validateLineData(data: LineData): ValidationResult {
	if (!data.isNew) return { valid: true };

	const number = (data.number ?? "").trim();
	const { min: numMin, max: numMax } = VALIDATION_LIMITS.LINE_NUMBER;

	if (number.length < numMin || number.length > numMax) {
		return { valid: false, error: `Line number must be ${numMin}-${numMax} characters` };
	}

	if (data.description !== undefined && data.description !== null) {
		const description = data.description.trim();
		if (description.length > VALIDATION_LIMITS.LINE_DESCRIPTION.max) {
			return {
				valid: false,
				error: `Line description must be at most ${VALIDATION_LIMITS.LINE_DESCRIPTION.max} characters`,
			};
		}
	}

	return { valid: true };
}

// ─── Stops ────────────────────────────────────────────────────────────────────

interface StopData {
	city: string;
	name: string;
	id?: string;
}

export function validateStopsArray(stops: StopData[]): ValidationResult {
	const { min, max } = VALIDATION_LIMITS.STOPS_ARRAY;

	if (stops.length < min) {
		return { valid: false, error: `At least ${min} stops are required` };
	}

	if (stops.length > max) {
		return { valid: false, error: `Maximum ${max} stops allowed, got ${stops.length}` };
	}

	for (let i = 0; i < stops.length; i++) {
		const city = sanitizeString(stops[i].city, VALIDATION_LIMITS.STOP_CITY.max + 1);
		if (
			city.length < VALIDATION_LIMITS.STOP_CITY.min ||
			city.length > VALIDATION_LIMITS.STOP_CITY.max
		) {
			return {
				valid: false,
				error: `Stop ${i + 1}: city must be ${VALIDATION_LIMITS.STOP_CITY.min}-${VALIDATION_LIMITS.STOP_CITY.max} characters`,
			};
		}

		const name = sanitizeString(stops[i].name, VALIDATION_LIMITS.STOP_NAME.max + 1);
		if (
			name.length < VALIDATION_LIMITS.STOP_NAME.min ||
			name.length > VALIDATION_LIMITS.STOP_NAME.max
		) {
			return {
				valid: false,
				error: `Stop ${i + 1}: name must be ${VALIDATION_LIMITS.STOP_NAME.min}-${VALIDATION_LIMITS.STOP_NAME.max} characters`,
			};
		}
	}

	return { valid: true };
}

// ─── Direction ────────────────────────────────────────────────────────────────

export function validateDirection(direction: string): ValidationResult {
	const trimmed = sanitizeString(direction, VALIDATION_LIMITS.DIRECTION.max + 1);
	const { min, max } = VALIDATION_LIMITS.DIRECTION;

	if (trimmed.length < min || trimmed.length > max) {
		return { valid: false, error: `Direction must be ${min}-${max} characters` };
	}

	return { valid: true };
}

// ─── Days ─────────────────────────────────────────────────────────────────────

export function validateDays(days: string[]): ValidationResult {
	const { min, max } = VALIDATION_LIMITS.DAYS_ARRAY;

	if (days.length < min) {
		return { valid: false, error: `At least ${min} day is required` };
	}

	if (days.length > max) {
		return { valid: false, error: `Maximum ${max} days allowed, got ${days.length}` };
	}

	for (const day of days) {
		if (!(VALID_DAYS as readonly string[]).includes(day)) {
			return {
				valid: false,
				error: `Invalid day: '${day}'. Valid days: ${VALID_DAYS.join(", ")}`,
			};
		}
	}

	return { valid: true };
}

// ─── Departure Times ──────────────────────────────────────────────────────────

export function validateDepartureTimes(departures: string): ValidationResult {
	const lines = departures.split("\n").filter((line) => line.trim() !== "");

	const validTimes = lines.filter((line) => TIME_REGEX.test(line.trim()));

	if (validTimes.length < VALIDATION_LIMITS.DEPARTURE_TIMES.min) {
		return {
			valid: false,
			error: `At least ${VALIDATION_LIMITS.DEPARTURE_TIMES.min} valid departure time is required`,
		};
	}

	if (validTimes.length > VALIDATION_LIMITS.DEPARTURE_TIMES.max) {
		return {
			valid: false,
			error: `Maximum ${VALIDATION_LIMITS.DEPARTURE_TIMES.max} departure times allowed, got ${validTimes.length}`,
		};
	}

	return { valid: true };
}

// ─── Report ───────────────────────────────────────────────────────────────────

interface ReportData {
	scheduleId: string;
	reason: ValidReportReason | string;
	comment: string;
}

export function validateReportData(data: ReportData): ValidationResult {
	if (!isValidUUID(data.scheduleId)) {
		return { valid: false, error: "scheduleId must be a valid UUID" };
	}

	if (!(VALID_REPORT_REASONS as readonly string[]).includes(data.reason)) {
		return { valid: false, error: `Invalid report reason: '${data.reason}'` };
	}

	const comment = sanitizeString(data.comment ?? "", VALIDATION_LIMITS.REPORT_COMMENT.max + 1);
	if (comment.length > VALIDATION_LIMITS.REPORT_COMMENT.max) {
		return {
			valid: false,
			error: `Comment must be at most ${VALIDATION_LIMITS.REPORT_COMMENT.max} characters`,
		};
	}

	return { valid: true };
}
