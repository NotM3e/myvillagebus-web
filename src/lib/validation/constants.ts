export const VALIDATION_LIMITS = {
	CARRIER_NAME: { min: 1, max: 100 },
	LINE_NUMBER: { min: 1, max: 50 },
	LINE_DESCRIPTION: { min: 0, max: 500 },
	STOPS_ARRAY: { min: 2, max: 50 },
	STOP_CITY: { min: 1, max: 100 },
	STOP_NAME: { min: 1, max: 150 },
	DIRECTION: { min: 1, max: 200 },
	DAYS_ARRAY: { min: 1, max: 7 },
	DEPARTURE_TIMES: { min: 1, max: 50 },
	REPORT_COMMENT: { min: 0, max: 1000 },
} as const;

export const VALID_DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"] as const;
export type ValidDay = (typeof VALID_DAYS)[number];

export const VALID_REPORT_REASONS = [
	"OUTDATED",
	"WRONG_TIME",
	"WRONG_ROUTE",
	"NOT_EXIST",
	"VANDALISM",
	"DUPLICATE",
	"OTHER",
] as const;
export type ValidReportReason = (typeof VALID_REPORT_REASONS)[number];

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const TIME_REGEX = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
