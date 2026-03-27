"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AuditAction, AuditLog } from "@/types/database";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import PersonIcon from "@mui/icons-material/Person";
import HistoryIcon from "@mui/icons-material/History";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RefreshIcon from "@mui/icons-material/Refresh";

// Human-readable labels for each audit action
const ACTION_LABELS: Record<AuditAction, { label: string; color: string }> = {
	REPORT_RESOLVE: { label: "Rozwiązanie zgłoszenia", color: "var(--md-sys-color-primary)]" },
	REPORT_DISMISS: { label: "Odrzucenie zgłoszenia", color: "var(--md-sys-color-tertiary)]" },
	SCHEDULE_APPROVE: { label: "Zatwierdzenie rozkładu", color: "var(--md-sys-color-primary)]" },
	SCHEDULE_REJECT: { label: "Odrzucenie rozkładu", color: "var(--md-sys-color-error)]" },
	SCHEDULE_ARCHIVE: { label: "Archiwizacja rozkładu", color: "var(--md-sys-color-tertiary)]" },
	USER_ROLE_CHANGE: { label: "Zmiana roli użytkownika", color: "var(--md-sys-color-secondary)]" },
	USER_SHADOW_BAN: { label: "Shadow ban", color: "var(--md-sys-color-tertiary)]" },
	USER_BAN: { label: "Ban użytkownika", color: "var(--md-sys-color-error)]" },
	USER_UNBAN: { label: "Odbanowanie", color: "var(--md-sys-color-primary)]" },
	STOP_MERGE: { label: "Scalenie przystanków", color: "var(--md-sys-color-secondary)]" },
	STOP_VERIFY: { label: "Weryfikacja przystanku", color: "var(--md-sys-color-primary)]" },
	CARRIER_VERIFY: { label: "Weryfikacja przewoźnika", color: "var(--md-sys-color-primary)]" },
	SETTINGS_CHANGE: { label: "Zmiana ustawień", color: "var(--md-sys-color-outline)]" },
};

// Grouping for filter dropdown
const ACTION_GROUPS: { label: string; actions: AuditAction[] }[] = [
	{
		label: "Zgłoszenia",
		actions: ["REPORT_RESOLVE", "REPORT_DISMISS"],
	},
	{
		label: "Rozkłady",
		actions: ["SCHEDULE_APPROVE", "SCHEDULE_REJECT", "SCHEDULE_ARCHIVE"],
	},
	{
		label: "Użytkownicy",
		actions: ["USER_ROLE_CHANGE", "USER_SHADOW_BAN", "USER_BAN", "USER_UNBAN"],
	},
	{
		label: "Dane",
		actions: ["STOP_MERGE", "STOP_VERIFY", "CARRIER_VERIFY"],
	},
	{
		label: "System",
		actions: ["SETTINGS_CHANGE"],
	},
];

const PAGE_SIZE = 50;

interface AuditLogWithUser extends AuditLog {
	profiles?: {
		display_name: string | null;
	} | null;
}

// Component for expanding and exploring JSONB payload
function PayloadExplorer({ payload }: { payload: Record<string, unknown> }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<div className="mt-3 rounded-lg overflow-hidden border border-(--md-sys-color-outline-variant)">
			{/* Header with copy button */}
			<div className="flex items-center justify-between px-3 py-1.5 bg-(--md-sys-color-surface-variant)">
				<span className="md-label-small text-(--md-sys-color-on-surface-variant)">
					Payload
				</span>
				<button
					onClick={handleCopy}
					className="flex items-center gap-1 px-2 py-0.5 rounded text-xs hover:bg-(--md-sys-color-surface) transition-colors text-(--md-sys-color-on-surface-variant)"
					title="Kopiuj JSON"
				>
					<ContentCopyIcon sx={{ fontSize: 14 }} />
					{copied ? "Skopiowano!" : "Kopiuj"}
				</button>
			</div>

			{/* Key-value pairs */}
			<div className="px-3 py-2 space-y-1 bg-(--md-sys-color-surface)">
				{Object.entries(payload).map(([key, value]) => (
					<PayloadField key={key} fieldKey={key} value={value} />
				))}
			</div>
		</div>
	);
}

// Recursively render payload fields
function PayloadField({ fieldKey, value }: { fieldKey: string; value: unknown }) {
	const [expanded, setExpanded] = useState(false);

	// Check if value is a nested object or array
	const isObject = value !== null && typeof value === "object";
	const isArray = Array.isArray(value);

	if (isObject) {
		const entries = isArray
			? (value as unknown[]).map((v, i) => [String(i), v] as [string, unknown])
			: Object.entries(value as Record<string, unknown>);

		return (
			<div>
				<button
					onClick={() => setExpanded(!expanded)}
					className="flex items-center gap-1 w-full text-left hover:bg-(--md-sys-color-surface-variant) rounded px-1 -mx-1 transition-colors"
				>
					{expanded ? (
						<ExpandLessIcon
							sx={{ fontSize: 16, color: "var(--md-sys-color-primary)]" }}
						/>
					) : (
						<ExpandMoreIcon
							sx={{ fontSize: 16, color: "var(--md-sys-color-primary)]" }}
						/>
					)}
					<span className="md-label-medium text-(--md-sys-color-primary)">
						{fieldKey}
					</span>
					<span className="md-body-small text-(--md-sys-color-on-surface-variant) ml-1">
						{isArray ? `[${entries.length}]` : `{${entries.length}}`}
					</span>
				</button>
				{expanded && (
					<div className="ml-4 pl-3 border-l-2 border-(--md-sys-color-outline-variant) mt-1 space-y-1">
						{entries.map(([k, v]) => (
							<PayloadField key={k} fieldKey={k} value={v} />
						))}
					</div>
				)}
			</div>
		);
	}

	// Primitive value
	return (
		<div className="flex items-baseline gap-2 px-1">
			<span className="md-label-medium text-(--md-sys-color-on-surface-variant) shrink-0">
				{fieldKey}:
			</span>
			<span className="md-body-small text-(--md-sys-color-on-surface) break-all">
				{value === null ? (
					<span className="italic text-(--md-sys-color-outline)">null</span>
				) : typeof value === "boolean" ? (
					<span
						className="px-1.5 py-0.5 rounded text-xs"
						style={{
							backgroundColor: value
								? "var(--md-sys-color-primary-container)]"
								: "var(--md-sys-color-error-container)]",
							color: value
								? "var(--md-sys-color-on-primary-container)]"
								: "var(--md-sys-color-on-error-container)]",
						}}
					>
						{String(value)}
					</span>
				) : (
					String(value)
				)}
			</span>
		</div>
	);
}

export default function ManaLogsPage() {
	const [logs, setLogs] = useState<AuditLogWithUser[]>([]);
	const [loading, setLoading] = useState(true);
	const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

	// Filters
	const [searchQuery, setSearchQuery] = useState("");
	const [actionFilter, setActionFilter] = useState<AuditAction | "all">("all");
	const [targetIdFilter, setTargetIdFilter] = useState("");

	// Pagination
	const [page, setPage] = useState(0);
	const [hasMore, setHasMore] = useState(true);
	const [totalCount, setTotalCount] = useState<number | null>(null);

	const fetchLogs = useCallback(async () => {
		setLoading(true);
		const supabase = createClient();

		let query = supabase
			.from("audit_logs")
			.select("*, profiles!audit_logs_user_id_fkey(display_name)", { count: "exact" })
			.order("created_at", { ascending: false })
			.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

		if (actionFilter !== "all") {
			query = query.eq("action", actionFilter);
		}

		if (targetIdFilter.trim()) {
			query = query.eq("target_id", targetIdFilter.trim());
		}

		const { data, error, count } = await query;

		if (error) {
			console.error("Error fetching audit logs:", error);
			setLogs([]);
			setTotalCount(0);
		} else {
			setLogs(data || []);
			setTotalCount(count);
			setHasMore((data?.length ?? 0) === PAGE_SIZE);
		}
		setLoading(false);
	}, [page, actionFilter, targetIdFilter]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	// Reset pagination when filters change
	useEffect(() => {
		setPage(0);
	}, [actionFilter, targetIdFilter]);

	const toggleExpand = (id: string) => {
		setExpandedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	};

	// Client-side filtering by user name (search query)
	const filteredLogs = logs.filter((log) => {
		if (!searchQuery.trim()) return true;
		const query = searchQuery.toLowerCase();

		const userName = log.profiles?.display_name?.toLowerCase() || "";
		const userId = log.user_id.toLowerCase();
		const action = log.action.toLowerCase();
		const targetId = log.target_id?.toLowerCase() || "";
		const payloadStr = log.payload ? JSON.stringify(log.payload).toLowerCase() : "";

		return (
			userName.includes(query) ||
			userId.includes(query) ||
			action.includes(query) ||
			targetId.includes(query) ||
			payloadStr.includes(query)
		);
	});

	const formatDateTime = (dateStr: string) => {
		const date = new Date(dateStr);
		return date.toLocaleString("pl-PL", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	};

	const formatRelativeTime = (dateStr: string) => {
		const now = new Date();
		const date = new Date(dateStr);
		const diffMs = now.getTime() - date.getTime();
		const diffMinutes = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMinutes < 1) return "Przed chwilą";
		if (diffMinutes < 60) return `${diffMinutes} min temu`;
		if (diffHours < 24) return `${diffHours} godz. temu`;
		if (diffDays < 7) return `${diffDays} dni temu`;
		return null;
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="md-headline-medium">Dziennik zdarzeń</h1>
				<button
					onClick={() => fetchLogs()}
					disabled={loading}
					className="flex items-center gap-2 px-4 py-2 rounded-full bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface-variant) hover:bg-(--md-sys-color-outline-variant) transition-colors disabled:opacity-50"
					title="Odśwież"
				>
					<RefreshIcon sx={{ fontSize: 20 }} className={loading ? "animate-spin" : ""} />
					<span className="md-label-medium">Odśwież</span>
				</button>
			</div>

			{/* Filters */}
			<div className="flex flex-wrap gap-4 mb-6">
				{/* Search by user / content */}
				<div className="relative flex-1 min-w-[200px]">
					<SearchIcon
						sx={{
							position: "absolute",
							left: 12,
							top: "50%",
							transform: "translateY(-50%)",
							fontSize: 20,
							color: "var(--md-sys-color-on-surface-variant)]",
						}}
					/>
					<input
						type="text"
						placeholder="Szukaj po użytkowniku, akcji, ID..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-2 rounded-lg bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
					/>
				</div>

				{/* Action type filter */}
				<div className="flex items-center gap-2">
					<FilterListIcon
						sx={{ fontSize: 20, color: "var(--md-sys-color-on-surface-variant)]" }}
					/>
					<select
						value={actionFilter}
						onChange={(e) => setActionFilter(e.target.value as AuditAction | "all")}
						className="px-3 py-2 rounded-lg bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) border-none focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary)"
					>
						<option value="all">Wszystkie akcje</option>
						{ACTION_GROUPS.map((group) => (
							<optgroup key={group.label} label={group.label}>
								{group.actions.map((action) => (
									<option key={action} value={action}>
										{ACTION_LABELS[action].label}
									</option>
								))}
							</optgroup>
						))}
					</select>
				</div>

				{/* Target ID filter */}
				<div className="relative min-w-[180px]">
					<input
						type="text"
						placeholder="Filtruj po ID obiektu..."
						value={targetIdFilter}
						onChange={(e) => setTargetIdFilter(e.target.value)}
						className="w-full px-4 py-2 rounded-lg bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface) focus:outline-none focus:ring-2 focus:ring-(--md-sys-color-primary) text-sm"
					/>
				</div>
			</div>

			{/* Results count */}
			{!loading && totalCount !== null && (
				<p className="md-body-small text-(--md-sys-color-on-surface-variant) mb-4">
					Wyświetlono {filteredLogs.length} z {totalCount} zdarzeń
					{actionFilter !== "all" && ` (filtr: ${ACTION_LABELS[actionFilter].label})`}
				</p>
			)}

			{/* Log entries */}
			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin" />
				</div>
			) : filteredLogs.length === 0 ? (
				<div className="md-card md-elevation-1 p-8 text-center">
					<HistoryIcon
						sx={{
							fontSize: 48,
							color: "var(--md-sys-color-on-surface-variant)]",
							mb: 2,
						}}
					/>
					<p className="md-body-large text-(--md-sys-color-on-surface-variant)">
						Brak zdarzeń do wyświetlenia
					</p>
					<p className="md-body-small text-(--md-sys-color-outline) mt-1">
						Zmień filtry lub poczekaj na nowe zdarzenia
					</p>
				</div>
			) : (
				<div className="space-y-2">
					{filteredLogs.map((log) => {
						const actionConfig = ACTION_LABELS[log.action] || {
							label: log.action,
							color: "var(--md-sys-color-outline)]",
						};
						const isExpanded = expandedIds.has(log.id);
						const relativeTime = formatRelativeTime(log.created_at);

						return (
							<div
								key={log.id}
								className="md-card md-elevation-1 p-4 border-l-4 transition-all"
								style={{ borderLeftColor: actionConfig.color }}
							>
								<div className="flex items-start gap-3">
									{/* Action indicator */}
									<div
										className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5"
										style={{ backgroundColor: `${actionConfig.color}20` }}
									>
										<HistoryIcon
											sx={{ fontSize: 20, color: actionConfig.color }}
										/>
									</div>

									{/* Content */}
									<div className="flex-1 min-w-0">
										{/* Action label + time */}
										<div className="flex items-center justify-between gap-2 mb-1">
											<span
												className="md-title-small"
												style={{ color: actionConfig.color }}
											>
												{actionConfig.label}
											</span>
											<div className="flex items-center gap-2 shrink-0">
												{relativeTime && (
													<span className="md-label-small text-(--md-sys-color-primary) bg-(--md-sys-color-primary-container) px-2 py-0.5 rounded-full">
														{relativeTime}
													</span>
												)}
												<span className="md-body-small text-(--md-sys-color-on-surface-variant)">
													{formatDateTime(log.created_at)}
												</span>
											</div>
										</div>

										{/* User + target info */}
										<div className="flex items-center gap-4 flex-wrap">
											<span className="flex items-center gap-1 md-body-small text-(--md-sys-color-on-surface-variant)">
												<PersonIcon sx={{ fontSize: 14 }} />
												{log.profiles?.display_name ||
													"Nieznany użytkownik"}
											</span>

											{log.target_table && (
												<span className="md-body-small text-(--md-sys-color-on-surface-variant)">
													Tabela:{" "}
													<span className="font-mono text-(--md-sys-color-on-surface)">
														{log.target_table}
													</span>
												</span>
											)}

											{log.target_id && (
												<span className="md-body-small text-(--md-sys-color-on-surface-variant)">
													ID:{" "}
													<span className="font-mono text-(--md-sys-color-on-surface) text-xs">
														{log.target_id.length > 42
															? `${log.target_id.slice(0, 42)}...`
															: log.target_id}
													</span>
												</span>
											)}
										</div>

										{/* Payload toggle */}
										{log.payload && Object.keys(log.payload).length > 0 && (
											<>
												<button
													onClick={() => toggleExpand(log.id)}
													className="flex items-center gap-1 mt-2 text-(--md-sys-color-primary) hover:text-(--md-sys-color-on-primary-container) transition-colors"
												>
													{isExpanded ? (
														<ExpandLessIcon sx={{ fontSize: 18 }} />
													) : (
														<ExpandMoreIcon sx={{ fontSize: 18 }} />
													)}
													<span className="md-label-medium">
														{isExpanded
															? "Ukryj szczegóły"
															: "Pokaż szczegóły"}
													</span>
												</button>

												{isExpanded && (
													<PayloadExplorer payload={log.payload} />
												)}
											</>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Pagination */}
			{!loading && totalCount !== null && totalCount > PAGE_SIZE && (
				<div className="flex items-center justify-center gap-4 mt-6">
					<button
						onClick={() => setPage((p) => Math.max(0, p - 1))}
						disabled={page === 0}
						className="md-outlined-button disabled:opacity-50"
					>
						Poprzednia
					</button>

					<span className="md-body-medium text-(--md-sys-color-on-surface-variant)">
						Strona {page + 1} z {Math.ceil(totalCount / PAGE_SIZE)}
					</span>

					<button
						onClick={() => setPage((p) => p + 1)}
						disabled={!hasMore}
						className="md-outlined-button disabled:opacity-50"
					>
						Następna
					</button>
				</div>
			)}
		</div>
	);
}
