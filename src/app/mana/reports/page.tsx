"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/supabase/audit";
import Link from "next/link";

import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";

type ReportReason =
	| "OUTDATED"
	| "WRONG_TIME"
	| "WRONG_ROUTE"
	| "NOT_EXIST"
	| "VANDALISM"
	| "DUPLICATE"
	| "OTHER";

type ReportStatus = "pending" | "resolved" | "dismissed";

interface Report {
	id: string;
	reason: ReportReason;
	description: string | null;
	status: ReportStatus;
	created_at: string;
	schedule_id: string | null;
	reporter_id: string | null;
	schedule?: {
		direction: string;
		line?: {
			number: string;
			carrier?: {
				name: string;
			};
		};
	};
	reporter?: {
		display_name: string | null;
	};
}

const REASON_CONFIG: Record<ReportReason, { label: string; priority: number; color: string }> = {
	VANDALISM: { label: "Trolling / Wandalizm", priority: 1, color: "var(--md-sys-color-error)" },
	NOT_EXIST: { label: "Przejazd nie istnieje", priority: 1, color: "var(--md-sys-color-error)" },
	WRONG_TIME: { label: "Błędna godzina", priority: 2, color: "var(--md-sys-color-tertiary)" },
	WRONG_ROUTE: { label: "Błędna trasa", priority: 2, color: "var(--md-sys-color-tertiary)" },
	OUTDATED: { label: "Nieaktualny rozkład", priority: 3, color: "var(--md-sys-color-secondary)" },
	DUPLICATE: { label: "Duplikat", priority: 3, color: "var(--md-sys-color-secondary)" },
	OTHER: { label: "Inny problem", priority: 3, color: "var(--md-sys-color-outline)" },
};

const STATUS_LABELS: Record<ReportStatus, string> = {
	pending: "Oczekuje",
	resolved: "Rozwiązane",
	dismissed: "Odrzucone",
};

export default function ManaReportsPage() {
	const [reports, setReports] = useState<Report[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<ReportStatus | "all">("pending");
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const fetchReports = async () => {
		setLoading(true);
		const supabase = createClient();

		let query = supabase
			.from("reports")
			.select(
				`
        id,
        reason,
        description,
        status,
        created_at,
        schedule_id,
        reporter_id,
        schedule:schedules (
          direction,
          line:lines (
            number,
            carrier:carriers (
              name
            )
          )
        ),
        reporter:profiles!reporter_id (
          display_name
        )
      `
			)
			.order("created_at", { ascending: false });

		if (filter !== "all") {
			query = query.eq("status", filter);
		}

		const { data, error } = await query;

		if (error) {
			console.error("Error fetching reports:", error);
			setReports([]);
		} else {
			// Normalize nested data and sort by priority
			const normalized = (data || []).map((r: any) => ({
				...r,
				schedule: Array.isArray(r.schedule) ? r.schedule[0] : r.schedule,
				reporter: Array.isArray(r.reporter) ? r.reporter[0] : r.reporter,
			}));

			// Sort by priority (critical first)
			normalized.sort((a: Report, b: Report) => {
				const priorityA = REASON_CONFIG[a.reason]?.priority ?? 99;
				const priorityB = REASON_CONFIG[b.reason]?.priority ?? 99;
				if (priorityA !== priorityB) return priorityA - priorityB;
				return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
			});

			setReports(normalized);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchReports();
	}, [filter]);

	const handleAction = async (reportId: string, action: "resolve" | "dismiss") => {
		setActionLoading(reportId);
		const supabase = createClient();

		const newStatus = action === "resolve" ? "resolved" : "dismissed";

		const { error } = await supabase
			.from("reports")
			.update({
				status: newStatus,
				resolved_at: new Date().toISOString(),
				resolved_by: (await supabase.auth.getUser()).data.user?.id,
			})
			.eq("id", reportId);

		if (!error) {
			await logAuditEvent({
				action: action === "resolve" ? "REPORT_RESOLVE" : "REPORT_DISMISS",
				targetTable: "reports",
				targetId: reportId,
				payload: { newStatus },
			});
			fetchReports();
		}

		setActionLoading(null);
	};

	const formatDate = (date: string) => {
		return new Date(date).toLocaleDateString("pl-PL", {
			day: "numeric",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getPriorityIcon = (reason: ReportReason) => {
		const priority = REASON_CONFIG[reason]?.priority ?? 3;
		if (priority === 1)
			return <ErrorIcon sx={{ fontSize: 20, color: "var(--md-sys-color-error)" }} />;
		if (priority === 2)
			return (
				<WarningAmberIcon sx={{ fontSize: 20, color: "var(--md-sys-color-tertiary)" }} />
			);
		return <InfoIcon sx={{ fontSize: 20, color: "var(--md-sys-color-outline)" }} />;
	};

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="md-headline-medium">Zgłoszenia</h1>

				{/* Filter */}
				<div className="flex items-center gap-2">
					<FilterListIcon
						sx={{ fontSize: 20, color: "var(--md-sys-color-on-surface-variant)" }}
					/>
					<select
						value={filter}
						onChange={(e) => setFilter(e.target.value as ReportStatus | "all")}
						className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
					>
						<option value="pending">Oczekujące</option>
						<option value="resolved">Rozwiązane</option>
						<option value="dismissed">Odrzucone</option>
						<option value="all">Wszystkie</option>
					</select>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
				</div>
			) : reports.length === 0 ? (
				<div className="md-card md-elevation-1 p-8 text-center">
					<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
						Brak zgłoszeń
						{filter !== "all"
							? ` o statusie "${STATUS_LABELS[filter as ReportStatus]}"`
							: ""}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{reports.map((report) => {
						const config = REASON_CONFIG[report.reason];
						const isLoading = actionLoading === report.id;

						return (
							<div
								key={report.id}
								className="md-card md-elevation-1 p-4 border-l-4"
								style={{ borderLeftColor: config?.color }}
							>
								<div className="flex items-start gap-4">
									{/* Priority icon */}
									<div className="mt-1">{getPriorityIcon(report.reason)}</div>

									{/* Content */}
									<div className="flex-1 min-w-0">
										{/* Header */}
										<div className="flex items-center gap-2 mb-1">
											<span
												className="px-2 py-0.5 rounded-full text-xs font-medium"
												style={{
													backgroundColor: `${config?.color}20`,
													color: config?.color,
												}}
											>
												{config?.label}
											</span>
											<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
												{formatDate(report.created_at)}
											</span>
										</div>

										{/* Schedule info */}
										{report.schedule && (
											<p className="md-body-medium mb-1">
												<strong>
													{report.schedule.line?.carrier?.name}
												</strong>{" "}
												- Linia {report.schedule.line?.number}:{" "}
												{report.schedule.direction}
											</p>
										)}

										{/* Description */}
										{report.description && (
											<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-2">
												"{report.description}"
											</p>
										)}

										{/* Reporter */}
										<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
											Zgłosił: {report.reporter?.display_name || "Nieznany"}
										</p>
									</div>

									{/* Actions */}
									<div className="flex items-center gap-2">
										{report.schedule_id && (
											<Link
												href={`/app/schedule/${report.schedule_id}`}
												target="_blank"
												className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
												title="Zobacz rozkład"
											>
												<OpenInNewIcon
													sx={{
														fontSize: 20,
														color: "var(--md-sys-color-on-surface-variant)",
													}}
												/>
											</Link>
										)}

										{report.status === "pending" && (
											<>
												<button
													onClick={() =>
														handleAction(report.id, "resolve")
													}
													disabled={isLoading}
													className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-primary-container)] transition-colors disabled:opacity-50"
													title="Rozwiąż"
												>
													{isLoading ? (
														<div className="w-5 h-5 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
													) : (
														<CheckCircleIcon
															sx={{
																fontSize: 20,
																color: "var(--md-sys-color-primary)",
															}}
														/>
													)}
												</button>

												<button
													onClick={() =>
														handleAction(report.id, "dismiss")
													}
													disabled={isLoading}
													className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-error-container)] transition-colors disabled:opacity-50"
													title="Odrzuć"
												>
													<CancelIcon
														sx={{
															fontSize: 20,
															color: "var(--md-sys-color-error)",
														}}
													/>
												</button>
											</>
										)}

										{report.status !== "pending" && (
											<span
												className={`px-3 py-1 rounded-full text-xs ${
													report.status === "resolved"
														? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
														: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
												}`}
											>
												{STATUS_LABELS[report.status]}
											</span>
										)}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
