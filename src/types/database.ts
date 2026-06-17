// ============================================================
// ENUMY
// ============================================================

export type ScheduleStatus = "pending" | "active" | "flagged" | "archived";
export type UpdateType = "fix" | "season_change";
export type UserRole = "viewer" | "contributor" | "trusted_editor" | "super_editor" | "admin";
export type UserStatus = "active" | "shadow_banned" | "banned";
export type CarrierStatus = "unverified" | "verified" | "partner";
export type VoteType = "positive" | "negative";
export type NegativeReason = "wrong_times" | "missing_stops" | "outdated" | "other";
export type ReportType = "data_error" | "trolling";
export type ReportStatus = "pending" | "resolved" | "dismissed";
export type ActivityType =
	| "schedule_created"
	| "times_added"
	| "upvote_received"
	| "downvote_received"
	| "report_confirmed"
	| "moderator_rejected";

// ============================================================
// TABELE
// ============================================================

export interface Profile {
	id: string;
	display_name: string | null;
	reputation: number;
	role: UserRole;
	status: UserStatus;
	created_at: string;
	last_active_at: string;
}

export interface Carrier {
	id: string;
	name: string;
	address: string | null;
	contact: string | null;
	cities_served: string[] | null;
	status: CarrierStatus;
	logo_url: string | null;
	created_at: string;
}

export interface Season {
	id: string;
	name: string;
	valid_from: string;
	valid_to: string;
	priority: number;
	created_at: string;
}

export interface Stop {
	id: string;
	city: string;
	name: string;
	is_verified: boolean;
	created_at: string;
	created_by: string | null;
}

export interface Line {
	id: string;
	carrier_id: string;
	number: string;
	description: string | null;
	operation_note: string | null;
	created_at: string;
}

export interface Schedule {
	id: string;
	line_id: string;
	direction: string;
	version: number;
	parent_id: string | null;
	status: ScheduleStatus;
	update_type: UpdateType | null;
	is_incomplete: boolean;
	is_verified: boolean;
	days: string[];
	excludes_holidays: boolean;
	season_id: string | null;
	created_by: string | null;
	created_at: string;
	last_modified_at: string;
	last_verified_at: string | null;
}

export interface RouteStop {
	id: string;
	schedule_id: string;
	stop_id: string;
	order_index: number;
	offset_minutes: number;
}

export interface Course {
	id: string;
	schedule_id: string;
	departure_time: string;
	use_offsets: boolean;
	created_at: string;
}

export interface CourseTime {
	id: string;
	course_id: string;
	stop_id: string;
	arrival_time: string | null;
	order_index: number;
}

export interface Override {
	id: string;
	name: string;
	date: string;
	force_season_id: string | null;
	priority: number;
	created_by: string | null;
	created_at: string;
}

export interface Verification {
	id: string;
	schedule_id: string;
	user_id: string;
	vote_type: VoteType;
	negative_reason: NegativeReason | null;
	weight: number;
	created_at: string;
}

export interface Report {
	id: string;
	type: ReportType;
	schedule_id: string | null;
	reported_user_id: string | null;
	reporter_id: string | null;
	description: string | null;
	status: ReportStatus;
	resolved_by: string | null;
	resolved_at: string | null;
	created_at: string;
}

export interface UserActivity {
	id: string;
	user_id: string;
	activity_type: ActivityType;
	reputation_change: number;
	related_schedule_id: string | null;
	created_at: string;
}

export interface Favorite {
	id: string;
	user_id: string;
	schedule_id: string;
	created_at: string;
}

// ============================================================
// VIEWS (rozszerzone typy)
// ============================================================

export interface ActiveScheduleView extends Schedule {
	line_number: string;
	line_description: string | null;
	line_operation_note: string | null;
	carrier_name: string;
	carrier_logo: string | null;
	carrier_status: CarrierStatus;
	net_score: number;
	first_departure: string | null;
}

export interface VerificationStatsView {
	schedule_id: string;
	positive_count: number;
	negative_count: number;
	net_score: number;
}

// ============================================================
// TYPY POMOCNICZE (dla UI)
// ============================================================

export interface RouteStopWithDetails extends RouteStop {
	stop: Stop;
}

export interface ScheduleWithDetails extends ActiveScheduleView {
	route_stops: RouteStopWithDetails[];
	courses: Course[];
}

// ============================================================
// AUDIT LOGS
// ============================================================

export type AuditAction =
	| "REPORT_RESOLVE"
	| "REPORT_DISMISS"
	| "SCHEDULE_APPROVE"
	| "SCHEDULE_REJECT"
	| "SCHEDULE_ARCHIVE"
	| "USER_ROLE_CHANGE"
	| "USER_SHADOW_BAN"
	| "USER_BAN"
	| "USER_UNBAN"
	| "STOP_MERGE"
	| "STOP_VERIFY"
	| "CARRIER_VERIFY"
	| "SETTINGS_CHANGE";

export interface AuditLog {
	id: string;
	user_id: string;
	action: AuditAction;
	target_table: string;
	target_id: string | null;
	payload: Record<string, unknown> | null;
	created_at: string;
}
