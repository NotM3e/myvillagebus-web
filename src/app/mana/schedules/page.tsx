"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { logAuditEvent } from "@/lib/supabase/audit";
import Link from "next/link";

import FilterListIcon from "@mui/icons-material/FilterList";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

type ScheduleStatus = "pending" | "active" | "flagged" | "archived";

interface PendingSchedule {
	id: string;
	direction: string;
	version: number;
	parent_id: string | null;
	status: ScheduleStatus;
	days: string[];
	excludes_holidays: boolean;
	created_at: string;
	created_by: string | null;
	line: {
		number: string;
		carrier: {
			name: string;
		};
	};
	creator: {
		display_name: string | null;
	} | null;
}

const STATUS_CONFIG: Record<ScheduleStatus, { label: string; color: string }> = {
	pending: { label: "Oczekuje", color: "var(--md-sys-color-tertiary)" },
	active: { label: "Aktywny", color: "var(--md-sys-color-primary)" },
	flagged: { label: "Oflagowany", color: "var(--md-sys-color-error)" },
	archived: { label: "Archiwum", color: "var(--md-sys-color-outline)" },
};

export default function ManaSchedulesPage() {
	const [schedules, setSchedules] = useState<PendingSchedule[]>([]);
	const [loading, setLoading] = useState(true);
	const [filter, setFilter] = useState<ScheduleStatus | "all">("pending");
	const [actionLoading, setActionLoading] = useState<string | null>(null);

	const fetchSchedules = async () => {
		setLoading(true);
		const supabase = createClient();

		let query = supabase
			.from("schedules")
			.select(
				`
        id,
        direction,
        version,
        parent_id,
        status,
        days,
        excludes_holidays,
        created_at,
        created_by,
        line:lines (
          number,
          carrier:carriers (
            name
          )
        ),
        creator:profiles!created_by (
          display_name
        )
      `
			)
			.order("created_at", { ascending: false });

		if (filter !== "all") {
			query = query.eq("status", filter);
		}

		const { data, error } = await query.limit(50);

		if (error) {
			console.error("Error fetching schedules:", error);
			setSchedules([]);
		} else {
			const normalized = (data || []).map((s: any) => ({
				...s,
				line: Array.isArray(s.line) ? s.line[0] : s.line,
				creator: Array.isArray(s.creator) ? s.creator[0] : s.creator,
			}));
			setSchedules(normalized);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchSchedules();
	}, [filter]);

	const handleApprove = async (scheduleId: string, parentId: string | null) => {
		setActionLoading(scheduleId);
		const supabase = createClient();

		// Jeśli jest parent, archiwizuj go
		if (parentId) {
			await supabase.from("schedules").update({ status: "archived" }).eq("id", parentId);
		}

		// Zatwierdź nowy schedule
		const { error } = await supabase
			.from("schedules")
			.update({ status: "active" })
			.eq("id", scheduleId);

		if (!error) {
			await logAuditEvent({
				action: "SCHEDULE_APPROVE",
				targetTable: "schedules",
				targetId: scheduleId,
				payload: { parentId, archivedParent: !!parentId },
			});
			fetchSchedules();
		}

		setActionLoading(null);
	};

	const handleReject = async (scheduleId: string) => {
		setActionLoading(scheduleId);
		const supabase = createClient();

		const { error } = await supabase
			.from("schedules")
			.update({ status: "archived" })
			.eq("id", scheduleId);

		if (!error) {
			await logAuditEvent({
				action: "SCHEDULE_REJECT",
				targetTable: "schedules",
				targetId: scheduleId,
			});
			fetchSchedules();
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

	return (
		<div>
			<div className="flex items-center justify-between mb-6">
				<h1 className="md-headline-medium">Rozkłady</h1>

				{/* Filter */}
				<div className="flex items-center gap-2">
					<FilterListIcon
						sx={{ fontSize: 20, color: "var(--md-sys-color-on-surface-variant)" }}
					/>
					<select
						value={filter}
						onChange={(e) => setFilter(e.target.value as ScheduleStatus | "all")}
						className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] border-none focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
					>
						<option value="pending">Oczekujące</option>
						<option value="active">Aktywne</option>
						<option value="flagged">Oflagowane</option>
						<option value="archived">Archiwum</option>
						<option value="all">Wszystkie</option>
					</select>
				</div>
			</div>

			{loading ? (
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
				</div>
			) : schedules.length === 0 ? (
				<div className="md-card md-elevation-1 p-8 text-center">
					<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
						Brak rozkładów
						{filter !== "all"
							? ` o statusie "${STATUS_CONFIG[filter as ScheduleStatus]?.label}"`
							: ""}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{schedules.map((schedule) => {
						const config = STATUS_CONFIG[schedule.status];
						const isLoading = actionLoading === schedule.id;
						const hasParent = !!schedule.parent_id;

						return (
							<div
								key={schedule.id}
								className="md-card md-elevation-1 p-4 border-l-4"
								style={{ borderLeftColor: config?.color }}
							>
								<div className="flex items-start gap-4">
									{/* Icon */}
									<div className="mt-1">
										{hasParent ? (
											<CompareArrowsIcon
												sx={{
													fontSize: 20,
													color: "var(--md-sys-color-tertiary)",
												}}
												titleAccess="Edycja istniejącego"
											/>
										) : (
											<NewReleasesIcon
												sx={{
													fontSize: 20,
													color: "var(--md-sys-color-primary)",
												}}
												titleAccess="Nowy rozkład"
											/>
										)}
									</div>

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
											{hasParent && (
												<span className="px-2 py-0.5 rounded-full text-xs bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
													v{schedule.version}
												</span>
											)}
											<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
												{formatDate(schedule.created_at)}
											</span>
										</div>

										{/* Schedule info */}
										<p className="md-body-medium mb-1">
											<strong>{schedule.line?.carrier?.name}</strong> - Linia{" "}
											{schedule.line?.number}
										</p>
										<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mb-2">
											{schedule.direction}
										</p>

										{/* Days */}
										<div className="flex flex-wrap gap-1 mb-2">
											{schedule.days.map((day) => (
												<span
													key={day}
													className="px-2 py-0.5 text-xs rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
												>
													{day}
												</span>
											))}
											{schedule.excludes_holidays && (
												<span className="px-2 py-0.5 text-xs rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
													bez świąt
												</span>
											)}
										</div>

										{/* Creator */}
										<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
											Autor: {schedule.creator?.display_name || "Nieznany"}
										</p>
									</div>

									{/* Actions */}
									<div className="flex items-center gap-2">
										<Link
											href={`/app/schedule/${schedule.id}`}
											target="_blank"
											className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
											title="Podgląd"
										>
											<VisibilityIcon
												sx={{
													fontSize: 20,
													color: "var(--md-sys-color-on-surface-variant)",
												}}
											/>
										</Link>

										{schedule.status === "pending" && (
											<>
												<button
													onClick={() =>
														handleApprove(
															schedule.id,
															schedule.parent_id
														)
													}
													disabled={isLoading}
													className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-primary-container)] transition-colors disabled:opacity-50"
													title="Zatwierdź"
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
													onClick={() => handleReject(schedule.id)}
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
