"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/supabase/audit";
import BanReasonModal from "@/components/manage/BanReasonModal";
import Link from "next/link";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PersonIcon from "@mui/icons-material/Person";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BlockIcon from "@mui/icons-material/Block";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ScheduleIcon from "@mui/icons-material/Schedule";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import FlagIcon from "@mui/icons-material/Flag";
import HistoryIcon from "@mui/icons-material/History";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

type UserRole = "viewer" | "contributor" | "trusted_editor" | "super_editor" | "admin";
type UserStatus = "active" | "shadow_banned" | "banned";

const ROLE_HIERARCHY: Record<UserRole, number> = {
	viewer: 0,
	contributor: 1,
	trusted_editor: 2,
	super_editor: 3,
	admin: 4,
};

const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
	viewer: { label: "Viewer", color: "var(--md-sys-color-outline)" },
	contributor: { label: "Contributor", color: "var(--md-sys-color-secondary)" },
	trusted_editor: { label: "Trusted Editor", color: "var(--md-sys-color-primary)" },
	super_editor: { label: "Super Editor", color: "var(--md-sys-color-tertiary)" },
	admin: { label: "Admin", color: "var(--md-sys-color-error)" },
};

const ROLE_OPTIONS: UserRole[] = [
	"viewer",
	"contributor",
	"trusted_editor",
	"super_editor",
	"admin",
];

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
	active: { label: "Aktywny", color: "var(--md-sys-color-primary)" },
	shadow_banned: { label: "Shadow Ban", color: "var(--md-sys-color-tertiary)" },
	banned: { label: "Zbanowany", color: "var(--md-sys-color-error)" },
};

interface UserProfile {
	id: string;
	display_name: string | null;
	reputation: number;
	role: UserRole;
	status: UserStatus;
	created_at: string;
	last_active_at: string | null;
}

interface UserStats {
	schedulesTotal: number;
	schedulesActive: number;
	schedulesRejected: number;
	votesGivenPositive: number;
	votesGivenNegative: number;
	votesReceivedPositive: number;
	votesReceivedNegative: number;
	reportsSent: number;
	reportsReceived: number;
}

interface UserSchedule {
	id: string;
	direction: string;
	version: number;
	status: string;
	days: string[];
	created_at: string;
	lineNumber: string;
	carrierName: string;
}

interface ModerationEntry {
	id: string;
	action: string;
	payload: Record<string, any> | null;
	created_at: string;
	moderatorName: string | null;
}

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function ManageUserDetailPage({ params }: PageProps) {
	const { id: userId } = use(params);

	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [stats, setStats] = useState<UserStats | null>(null);
	const [schedules, setSchedules] = useState<UserSchedule[]>([]);
	const [moderationHistory, setModerationHistory] = useState<ModerationEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Current admin
	const [currentUserId, setCurrentUserId] = useState<string | null>(null);
	const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

	// Actions
	const [actionLoading, setActionLoading] = useState(false);
	const [banModal, setBanModal] = useState<"shadow_banned" | "banned" | null>(null);

	useEffect(() => {
		fetchAllData();
	}, [userId]);

	const fetchAllData = async () => {
		setLoading(true);
		setError(null);
		const supabase = createClient();

		// Get current admin
		const {
			data: { user: currentUser },
		} = await supabase.auth.getUser();
		setCurrentUserId(currentUser?.id || null);

		if (currentUser) {
			const { data: adminProfile } = await supabase
				.from("profiles")
				.select("role")
				.eq("id", currentUser.id)
				.single();
			setCurrentUserRole((adminProfile?.role as UserRole) || null);
		}

		// Fetch profile
		const { data: profileData, error: profileError } = await supabase
			.from("profiles")
			.select("*")
			.eq("id", userId)
			.single();

		if (profileError || !profileData) {
			setError("Nie znaleziono użytkownika");
			setLoading(false);
			return;
		}

		setProfile(profileData as UserProfile);

		// Fetch stats in parallel
		const [
			totalRes,
			activeRes,
			rejectedRes,
			votesPositiveRes,
			votesNegativeRes,
			reportsSentRes,
			reportsReceivedRes,
		] = await Promise.all([
			supabase
				.from("schedules")
				.select("id", { count: "exact", head: true })
				.eq("created_by", userId),
			supabase
				.from("schedules")
				.select("id", { count: "exact", head: true })
				.eq("created_by", userId)
				.eq("status", "active"),
			supabase
				.from("schedules")
				.select("id", { count: "exact", head: true })
				.eq("created_by", userId)
				.eq("status", "archived"),
			supabase
				.from("verifications")
				.select("id", { count: "exact", head: true })
				.eq("user_id", userId)
				.eq("vote_type", "positive"),
			supabase
				.from("verifications")
				.select("id", { count: "exact", head: true })
				.eq("user_id", userId)
				.eq("vote_type", "negative"),
			supabase
				.from("reports")
				.select("id", { count: "exact", head: true })
				.eq("reporter_id", userId),
			supabase
				.from("reports")
				.select("id", { count: "exact", head: true })
				.eq("reported_user_id", userId),
		]);

		// Votes received - two-step approach
		let votesReceivedPositive = 0;
		let votesReceivedNegative = 0;

		const { data: userScheduleIds } = await supabase
			.from("schedules")
			.select("id")
			.eq("created_by", userId);

		const scheduleIdList = userScheduleIds?.map((s) => s.id) || [];

		if (scheduleIdList.length > 0) {
			const [recPosRes, recNegRes] = await Promise.all([
				supabase
					.from("verifications")
					.select("id", { count: "exact", head: true })
					.in("schedule_id", scheduleIdList)
					.eq("vote_type", "positive"),
				supabase
					.from("verifications")
					.select("id", { count: "exact", head: true })
					.in("schedule_id", scheduleIdList)
					.eq("vote_type", "negative"),
			]);
			votesReceivedPositive = recPosRes.count ?? 0;
			votesReceivedNegative = recNegRes.count ?? 0;
		}

		setStats({
			schedulesTotal: totalRes.count ?? 0,
			schedulesActive: activeRes.count ?? 0,
			schedulesRejected: rejectedRes.count ?? 0,
			votesGivenPositive: votesPositiveRes.count ?? 0,
			votesGivenNegative: votesNegativeRes.count ?? 0,
			votesReceivedPositive,
			votesReceivedNegative,
			reportsSent: reportsSentRes.count ?? 0,
			reportsReceived: reportsReceivedRes.count ?? 0,
		});

		// Fetch recent schedules
		const { data: schedulesData } = await supabase
			.from("schedules")
			.select(
				`
				id, direction, version, status, days, created_at,
				line:lines(number, carrier:carriers(name))
			`
			)
			.eq("created_by", userId)
			.order("created_at", { ascending: false })
			.limit(20);

		const mappedSchedules: UserSchedule[] = (schedulesData || []).map((s: any) => {
			const line = Array.isArray(s.line) ? s.line[0] : s.line;
			const carrier = Array.isArray(line?.carrier) ? line.carrier[0] : line?.carrier;
			return {
				id: s.id,
				direction: s.direction,
				version: s.version,
				status: s.status,
				days: s.days,
				created_at: s.created_at,
				lineNumber: line?.number || "?",
				carrierName: carrier?.name || "?",
			};
		});
		setSchedules(mappedSchedules);

		// Fetch moderation history (actions ON this user)
		const { data: auditData } = await supabase
			.from("audit_logs")
			.select(
				"id, action, payload, created_at, user_id, profiles!audit_logs_user_id_fkey(display_name)"
			)
			.eq("target_id", userId)
			.eq("target_table", "profiles")
			.order("created_at", { ascending: false })
			.limit(30);

		const mappedHistory: ModerationEntry[] = (auditData || []).map((log: any) => ({
			id: log.id,
			action: log.action,
			payload: log.payload,
			created_at: log.created_at,
			moderatorName: Array.isArray(log.profiles)
				? log.profiles[0]?.display_name
				: log.profiles?.display_name,
		}));
		setModerationHistory(mappedHistory);

		setLoading(false);
	};

	// Role change
	const handleRoleChange = async (newRole: UserRole) => {
		if (!profile || !currentUserRole) return;
		if (userId === currentUserId) return;
		if (ROLE_HIERARCHY[profile.role] >= ROLE_HIERARCHY[currentUserRole]) return;

		setActionLoading(true);
		const supabase = createClient();

		const { error } = await supabase
			.from("profiles")
			.update({ role: newRole })
			.eq("id", userId);

		if (!error) {
			await logAuditEvent({
				action: "USER_ROLE_CHANGE",
				targetTable: "profiles",
				targetId: userId,
				payload: { oldRole: profile.role, newRole },
			});
			await fetchAllData();
		}
		setActionLoading(false);
	};

	// Ban/Shadow ban with reason
	const handleBanConfirm = async (reason: string) => {
		if (!banModal || !profile || !currentUserRole) return;
		if (ROLE_HIERARCHY[profile.role] >= ROLE_HIERARCHY[currentUserRole]) return;

		setActionLoading(true);
		const supabase = createClient();

		const action = banModal === "shadow_banned" ? "USER_SHADOW_BAN" : "USER_BAN";

		const { error } = await supabase
			.from("profiles")
			.update({ status: banModal })
			.eq("id", userId);

		if (!error) {
			await logAuditEvent({
				action,
				targetTable: "profiles",
				targetId: userId,
				payload: { oldStatus: profile.status, newStatus: banModal, reason },
			});
			setBanModal(null);
			await fetchAllData();
		}
		setActionLoading(false);
	};

	// Unban
	const handleUnban = async () => {
		if (!profile || !currentUserRole) return;
		if (ROLE_HIERARCHY[profile.role] >= ROLE_HIERARCHY[currentUserRole]) return;

		setActionLoading(true);
		const supabase = createClient();

		const { error } = await supabase
			.from("profiles")
			.update({ status: "active" })
			.eq("id", userId);

		if (!error) {
			await logAuditEvent({
				action: "USER_UNBAN",
				targetTable: "profiles",
				targetId: userId,
				payload: { oldStatus: profile.status, newStatus: "active" },
			});
			await fetchAllData();
		}
		setActionLoading(false);
	};

	// Helpers
	const formatDate = (date: string | null) => {
		if (!date) return "Brak danych";
		return new Date(date).toLocaleDateString("pl-PL", {
			day: "numeric",
			month: "long",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getScheduleStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "var(--md-sys-color-primary)";
			case "pending":
				return "var(--md-sys-color-tertiary)";
			case "flagged":
				return "var(--md-sys-color-error)";
			default:
				return "var(--md-sys-color-outline)";
		}
	};

	const getActionLabel = (action: string) => {
		const labels: Record<string, string> = {
			USER_ROLE_CHANGE: "Zmiana roli",
			USER_SHADOW_BAN: "Shadow Ban",
			USER_BAN: "Ban",
			USER_UNBAN: "Odbanowanie",
		};
		return labels[action] || action;
	};

	const getActionColor = (action: string) => {
		if (action.includes("BAN") && !action.includes("UNBAN")) return "var(--md-sys-color-error)";
		if (action.includes("UNBAN")) return "var(--md-sys-color-primary)";
		return "var(--md-sys-color-secondary)";
	};

	const isSelf = userId === currentUserId;
	const canModify =
		currentUserRole &&
		profile &&
		!isSelf &&
		ROLE_HIERARCHY[profile.role] < ROLE_HIERARCHY[currentUserRole];

	// Loading
	if (loading) {
		return (
			<div>
				<div className="flex items-center gap-4 mb-6">
					<Link
						href="/manage/users"
						className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
					>
						<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
					</Link>
					<h1 className="md-title-large">Kartoteka użytkownika</h1>
				</div>
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	// Error
	if (error || !profile) {
		return (
			<div>
				<div className="flex items-center gap-4 mb-6">
					<Link
						href="/manage/users"
						className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
					>
						<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
					</Link>
					<h1 className="md-title-large">Kartoteka użytkownika</h1>
				</div>
				<div className="md-card md-elevation-1 p-8 text-center">
					<p className="md-body-large text-[var(--md-sys-color-error)]">{error}</p>
				</div>
			</div>
		);
	}

	const roleConfig = ROLE_CONFIG[profile.role];
	const statusConfig = STATUS_CONFIG[profile.status];

	return (
		<div>
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<Link
					href="/manage/users"
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
				>
					<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
				</Link>
				<h1 className="md-title-large">Kartoteka użytkownika</h1>
			</div>

			{/* Profile card */}
			<div
				className="md-card md-elevation-1 p-4 mb-6 border-l-4"
				style={{ borderLeftColor: roleConfig.color }}
			>
				<div className="flex items-start gap-4">
					{/* Avatar */}
					<div
						className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
						style={{ backgroundColor: `${roleConfig.color}20` }}
					>
						{profile.role === "admin" ? (
							<AdminPanelSettingsIcon
								sx={{ fontSize: 32, color: roleConfig.color }}
							/>
						) : profile.role === "trusted_editor" || profile.role === "super_editor" ? (
							<VerifiedUserIcon sx={{ fontSize: 32, color: roleConfig.color }} />
						) : (
							<PersonIcon sx={{ fontSize: 32, color: roleConfig.color }} />
						)}
					</div>

					{/* Info */}
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap mb-1">
							<h2 className="md-headline-small truncate">
								{profile.display_name || "Bez nazwy"}
							</h2>
							{isSelf && (
								<span className="px-2 py-0.5 rounded-full text-xs bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
									Ty
								</span>
							)}
						</div>

						{/* Role + Status badges */}
						<div className="flex items-center gap-2 flex-wrap mb-3">
							<span
								className="px-3 py-1 rounded-full text-sm"
								style={{
									backgroundColor: `${roleConfig.color}20`,
									color: roleConfig.color,
								}}
							>
								{roleConfig.label}
							</span>
							{profile.status !== "active" && (
								<span
									className="px-3 py-1 rounded-full text-sm flex items-center gap-1"
									style={{
										backgroundColor: `${statusConfig.color}20`,
										color: statusConfig.color,
									}}
								>
									{profile.status === "shadow_banned" ? (
										<VisibilityOffIcon sx={{ fontSize: 14 }} />
									) : (
										<BlockIcon sx={{ fontSize: 14 }} />
									)}
									{statusConfig.label}
								</span>
							)}
						</div>

						{/* Meta */}
						<div className="space-y-1">
							<p className="md-body-medium">
								Reputacja: <strong>{profile.reputation} pkt</strong>
							</p>
							<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
								Dołączył: {formatDate(profile.created_at)}
							</p>
							<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
								Ostatnia aktywność: {formatDate(profile.last_active_at)}
							</p>
							<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] font-mono truncate">
								ID: {profile.id}
							</p>
						</div>
					</div>
				</div>

				{/* Actions */}
				{canModify && (
					<div className="mt-4 pt-4 border-t border-[var(--md-sys-color-outline-variant)] flex flex-wrap items-center gap-3">
						{/* Role selector */}
						<div className="flex items-center gap-2">
							<span className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
								Rola:
							</span>
							<select
								value={profile.role}
								onChange={(e) => handleRoleChange(e.target.value as UserRole)}
								disabled={actionLoading || currentUserRole !== "admin"}
								className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] text-sm border-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] disabled:opacity-50"
							>
								{ROLE_OPTIONS.map((role) => (
									<option key={role} value={role}>
										{ROLE_CONFIG[role].label}
									</option>
								))}
							</select>
						</div>

						{/* Status buttons */}
						{profile.status === "active" ? (
							<div className="flex items-center gap-2">
								<button
									onClick={() => setBanModal("shadow_banned")}
									disabled={actionLoading}
									className="md-outlined-button text-sm flex items-center gap-1 disabled:opacity-50"
									style={{
										color: "var(--md-sys-color-tertiary)",
										borderColor: "var(--md-sys-color-tertiary)",
									}}
								>
									<VisibilityOffIcon sx={{ fontSize: 16 }} />
									Shadow Ban
								</button>
								<button
									onClick={() => setBanModal("banned")}
									disabled={actionLoading}
									className="md-outlined-button text-sm flex items-center gap-1 disabled:opacity-50"
									style={{
										color: "var(--md-sys-color-error)",
										borderColor: "var(--md-sys-color-error)",
									}}
								>
									<BlockIcon sx={{ fontSize: 16 }} />
									Ban
								</button>
							</div>
						) : (
							<button
								onClick={handleUnban}
								disabled={actionLoading}
								className="md-filled-button text-sm flex items-center gap-1 disabled:opacity-50"
							>
								{actionLoading ? (
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
								) : (
									<CheckCircleIcon sx={{ fontSize: 16 }} />
								)}
								Odbanuj
							</button>
						)}
					</div>
				)}
			</div>

			{/* Stats grid */}
			{stats && (
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
					<StatCard
						icon={ScheduleIcon}
						label="Rozkłady"
						value={stats.schedulesTotal}
						subValue={`${stats.schedulesActive} aktywnych`}
						color="var(--md-sys-color-primary)"
					/>
					<StatCard
						icon={ScheduleIcon}
						label="Odrzucone"
						value={stats.schedulesRejected}
						color="var(--md-sys-color-error)"
					/>
					<StatCard
						icon={ThumbUpIcon}
						label="Głosy oddane"
						value={stats.votesGivenPositive}
						subValue={`${stats.votesGivenNegative} negatywnych`}
						color="var(--md-sys-color-primary)"
					/>
					<StatCard
						icon={ThumbUpIcon}
						label="Głosy otrzymane"
						value={stats.votesReceivedPositive}
						subValue={`${stats.votesReceivedNegative} negatywnych`}
						color="var(--md-sys-color-secondary)"
					/>
					<StatCard
						icon={FlagIcon}
						label="Zgłoszenia wysłane"
						value={stats.reportsSent}
						color="var(--md-sys-color-tertiary)"
					/>
					<StatCard
						icon={FlagIcon}
						label="Zgłoszenia otrzymane"
						value={stats.reportsReceived}
						color="var(--md-sys-color-error)"
					/>
				</div>
			)}

			{/* Schedules section */}
			<div className="mb-6">
				<h3 className="md-title-medium mb-3 flex items-center gap-2">
					<ScheduleIcon sx={{ fontSize: 20, color: "var(--md-sys-color-primary)" }} />
					Utworzone rozkłady ({schedules.length})
				</h3>

				{schedules.length === 0 ? (
					<div className="md-card md-elevation-1 p-6 text-center">
						<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
							Użytkownik nie utworzył jeszcze żadnych rozkładów
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{schedules.map((schedule) => (
							<div
								key={schedule.id}
								className="md-card md-elevation-1 p-3 border-l-4 flex items-center gap-3"
								style={{ borderLeftColor: getScheduleStatusColor(schedule.status) }}
							>
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<span
											className="px-2 py-0.5 rounded-full text-xs"
											style={{
												backgroundColor: `${getScheduleStatusColor(schedule.status)}20`,
												color: getScheduleStatusColor(schedule.status),
											}}
										>
											{schedule.status}
										</span>
										<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
											v{schedule.version}
										</span>
									</div>
									<p className="md-body-medium truncate">
										<strong>{schedule.carrierName}</strong> - Linia{" "}
										{schedule.lineNumber}
									</p>
									<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] truncate">
										{schedule.direction}
									</p>
								</div>

								<Link
									href={`/manage/schedules/${schedule.id}`}
									className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors shrink-0"
								>
									<OpenInNewIcon
										sx={{
											fontSize: 18,
											color: "var(--md-sys-color-on-surface-variant)",
										}}
									/>
								</Link>
							</div>
						))}
					</div>
				)}
			</div>

			{/* Moderation history */}
			<div className="mb-6">
				<h3 className="md-title-medium mb-3 flex items-center gap-2">
					<HistoryIcon sx={{ fontSize: 20, color: "var(--md-sys-color-secondary)" }} />
					Historia moderacji ({moderationHistory.length})
				</h3>

				{moderationHistory.length === 0 ? (
					<div className="md-card md-elevation-1 p-6 text-center">
						<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
							Brak historii moderacji dla tego użytkownika
						</p>
					</div>
				) : (
					<div className="space-y-2">
						{moderationHistory.map((entry) => (
							<div
								key={entry.id}
								className="md-card md-elevation-1 p-3 border-l-4"
								style={{ borderLeftColor: getActionColor(entry.action) }}
							>
								<div className="flex items-center justify-between mb-1">
									<span
										className="md-title-small"
										style={{ color: getActionColor(entry.action) }}
									>
										{getActionLabel(entry.action)}
									</span>
									<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
										{formatDate(entry.created_at)}
									</span>
								</div>

								<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
									Moderator: {entry.moderatorName || "Nieznany"}
								</p>

								{/* Show payload details */}
								{entry.payload && (
									<div className="mt-2 p-2 rounded-lg bg-[var(--md-sys-color-surface-variant)]">
										{entry.payload.reason && (
											<p className="md-body-small">
												Powód:{" "}
												<strong>{entry.payload.reason as string}</strong>
											</p>
										)}
										{entry.payload.oldRole && (
											<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
												{entry.payload.oldRole as string} →{" "}
												{entry.payload.newRole as string}
											</p>
										)}
										{entry.payload.oldStatus && (
											<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
												{entry.payload.oldStatus as string} →{" "}
												{entry.payload.newStatus as string}
											</p>
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>

			{/* Ban modal */}
			{banModal && (
				<BanReasonModal
					isOpen={!!banModal}
					onClose={() => setBanModal(null)}
					action={banModal}
					userName={profile.display_name || "Bez nazwy"}
					onConfirm={handleBanConfirm}
					loading={actionLoading}
				/>
			)}
		</div>
	);
}

// Stat card component
function StatCard({
	icon: Icon,
	label,
	value,
	subValue,
	color,
}: {
	icon: typeof ScheduleIcon;
	label: string;
	value: number;
	subValue?: string;
	color: string;
}) {
	return (
		<div className="md-card md-elevation-1 p-3">
			<div className="flex items-center gap-2 mb-1">
				<Icon sx={{ fontSize: 18, color }} />
				<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
					{label}
				</span>
			</div>
			<p className="md-headline-small" style={{ color }}>
				{value}
			</p>
			{subValue && (
				<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
					{subValue}
				</p>
			)}
		</div>
	);
}
