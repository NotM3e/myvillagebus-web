"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import EditIcon from "@mui/icons-material/Edit";

interface ScheduleData {
	id: string;
	direction: string;
	version: number;
	days: string[];
	excludes_holidays: boolean;
	created_at: string;
	line: {
		number: string;
		carrier: {
			name: string;
		};
	};
	stops: {
		order_index: number;
		offset_minutes: number;
		stop: {
			city: string;
			name: string;
		};
	}[];
	course: {
		departure_time: string;
		use_offsets: boolean;
	} | null;
}

interface ScheduleCompareProps {
	isOpen: boolean;
	onClose: () => void;
	currentId: string;
	parentId: string;
	onApprove: () => void;
	onReject: () => void;
	loading: boolean;
}

export default function ScheduleCompare({
	isOpen,
	onClose,
	currentId,
	parentId,
	onApprove,
	onReject,
	loading,
}: ScheduleCompareProps) {
	const [current, setCurrent] = useState<ScheduleData | null>(null);
	const [parent, setParent] = useState<ScheduleData | null>(null);
	const [fetchLoading, setFetchLoading] = useState(true);

	useEffect(() => {
		if (!isOpen) return;

		const fetchData = async () => {
			setFetchLoading(true);
			const supabase = createClient();

			const fetchSchedule = async (id: string): Promise<ScheduleData | null> => {
				const { data: schedule } = await supabase
					.from("schedules")
					.select(
						`
            id,
            direction,
            version,
            days,
            excludes_holidays,
            created_at,
            line:lines (
              number,
              carrier:carriers (
                name
              )
            )
          `
					)
					.eq("id", id)
					.single();

				if (!schedule) return null;

				const { data: routeStops } = await supabase
					.from("route_stops")
					.select(
						`
            order_index,
            offset_minutes,
            stop:stops (
              city,
              name
            )
          `
					)
					.eq("schedule_id", id)
					.order("order_index");

				const { data: courses } = await supabase
					.from("courses")
					.select("departure_time, use_offsets")
					.eq("schedule_id", id)
					.limit(1);

				const lineData = Array.isArray(schedule.line) ? schedule.line[0] : schedule.line;
				const carrierData = Array.isArray(lineData?.carrier)
					? lineData.carrier[0]
					: lineData?.carrier;

				return {
					...schedule,
					line: {
						number: lineData?.number || "",
						carrier: {
							name: carrierData?.name || "",
						},
					},
					stops: (routeStops || []).map((rs: any) => ({
						...rs,
						stop: Array.isArray(rs.stop) ? rs.stop[0] : rs.stop,
					})),
					course: courses?.[0] || null,
				} as ScheduleData;
			};

			const [currentData, parentData] = await Promise.all([
				fetchSchedule(currentId),
				fetchSchedule(parentId),
			]);

			setCurrent(currentData);
			setParent(parentData);
			setFetchLoading(false);
		};

		fetchData();
	}, [isOpen, currentId, parentId]);

	if (!isOpen) return null;

	const formatTime = (time: string) => time?.slice(0, 5) || "--:--";

	const getDaysDiff = () => {
		if (!current || !parent) return { added: [], removed: [], same: [] };
		const added = current.days.filter((d) => !parent.days.includes(d));
		const removed = parent.days.filter((d) => !current.days.includes(d));
		const same = current.days.filter((d) => parent.days.includes(d));
		return { added, removed, same };
	};

	const getStopsDiff = () => {
		if (!current || !parent) return [];

		const maxLength = Math.max(current.stops.length, parent.stops.length);
		const diff = [];

		for (let i = 0; i < maxLength; i++) {
			const oldStop = parent.stops[i];
			const newStop = current.stops[i];

			const oldName = oldStop
				? `${oldStop.stop.city}${oldStop.stop.name ? `, ${oldStop.stop.name}` : ""}`
				: null;
			const newName = newStop
				? `${newStop.stop.city}${newStop.stop.name ? `, ${newStop.stop.name}` : ""}`
				: null;

			const oldOffset = oldStop?.offset_minutes ?? null;
			const newOffset = newStop?.offset_minutes ?? null;

			diff.push({
				index: i + 1,
				oldName,
				newName,
				oldOffset,
				newOffset,
				nameChanged: oldName !== newName,
				offsetChanged: oldOffset !== newOffset,
				added: !oldStop && !!newStop,
				removed: !!oldStop && !newStop,
			});
		}

		return diff;
	};

	const daysDiff = getDaysDiff();
	const stopsDiff = getStopsDiff();

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

			{/* Modal */}
			<div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-4xl max-h-[90vh] flex flex-col">
				<div className="bg-[var(--md-sys-color-surface)] rounded-3xl shadow-xl flex flex-col h-full overflow-hidden">
					{" "}
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)]">
						<h2 className="md-title-large">Porównanie wersji</h2>
						<button
							onClick={onClose}
							className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
						>
							<CloseIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
						</button>
					</div>
					{/* Content */}
					<div className="flex-1 overflow-y-auto p-4">
						{fetchLoading ? (
							<div className="flex items-center justify-center h-64">
								<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
							</div>
						) : !current || !parent ? (
							<p className="text-center text-[var(--md-sys-color-error)]">
								Nie udało się załadować danych
							</p>
						) : (
							<div className="space-y-6">
								{/* Header info */}
								<div className="text-center">
									<p className="md-title-medium">
										{current.line.carrier.name} - Linia {current.line.number}
									</p>
									<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
										{current.direction}
									</p>
									<div className="flex items-center justify-center gap-2 mt-2">
										<span className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface-variant)]">
											v{parent.version}
										</span>
										<ArrowForwardIcon
											sx={{
												fontSize: 20,
												color: "var(--md-sys-color-primary)",
											}}
										/>
										<span className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
											v{current.version}
										</span>
									</div>
								</div>

								{/* Days comparison */}
								<div className="md-card md-elevation-1 p-4">
									<h3 className="md-title-small mb-3">Dni kursowania</h3>
									<div className="flex flex-wrap gap-2">
										{daysDiff.same.map((day) => (
											<span
												key={day}
												className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface-variant)]"
											>
												{day}
											</span>
										))}
										{daysDiff.added.map((day) => (
											<span
												key={day}
												className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center gap-1"
											>
												<AddIcon sx={{ fontSize: 14 }} />
												{day}
											</span>
										))}
										{daysDiff.removed.map((day) => (
											<span
												key={day}
												className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] flex items-center gap-1 line-through"
											>
												<RemoveIcon sx={{ fontSize: 14 }} />
												{day}
											</span>
										))}
									</div>
								</div>

								{/* Departure time */}
								{current.course?.departure_time !==
									parent.course?.departure_time && (
									<div className="md-card md-elevation-1 p-4">
										<h3 className="md-title-small mb-3">Godzina odjazdu</h3>
										<div className="flex items-center gap-4">
											<span className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] line-through">
												{formatTime(parent.course?.departure_time || "")}
											</span>
											<ArrowForwardIcon
												sx={{
													fontSize: 20,
													color: "var(--md-sys-color-primary)",
												}}
											/>
											<span className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]">
												{formatTime(current.course?.departure_time || "")}
											</span>
										</div>
									</div>
								)}

								{/* Stops comparison */}
								<div className="md-card md-elevation-1 p-4">
									<h3 className="md-title-small mb-3">Przystanki</h3>
									<div className="space-y-2">
										{stopsDiff.map((stop) => {
											const hasChanges =
												stop.nameChanged ||
												stop.offsetChanged ||
												stop.added ||
												stop.removed;

											return (
												<div
													key={stop.index}
													className={`flex items-center gap-4 p-2 rounded-lg ${
														hasChanges
															? "bg-[var(--md-sys-color-surface-variant)]"
															: ""
													}`}
												>
													<span className="w-6 text-center md-body-small text-[var(--md-sys-color-on-surface-variant)]">
														{stop.index}.
													</span>

													<div className="flex-1 min-w-0">
														{stop.removed ? (
															<span className="text-[var(--md-sys-color-error)] line-through">
																{stop.oldName}
															</span>
														) : stop.added ? (
															<span className="text-[var(--md-sys-color-primary)]">
																{stop.newName}
															</span>
														) : stop.nameChanged ? (
															<div className="flex items-center gap-2">
																<span className="text-[var(--md-sys-color-error)] line-through">
																	{stop.oldName}
																</span>
																<ArrowForwardIcon
																	sx={{ fontSize: 16 }}
																/>
																<span className="text-[var(--md-sys-color-primary)]">
																	{stop.newName}
																</span>
															</div>
														) : (
															<span>{stop.newName}</span>
														)}
													</div>

													{stop.offsetChanged &&
														!stop.added &&
														!stop.removed && (
															<div className="flex items-center gap-2 text-sm">
																<span className="text-[var(--md-sys-color-on-surface-variant)]">
																	+{stop.oldOffset}min
																</span>
																<ArrowForwardIcon
																	sx={{ fontSize: 14 }}
																/>
																<span className="text-[var(--md-sys-color-primary)]">
																	+{stop.newOffset}min
																</span>
															</div>
														)}

													{hasChanges && (
														<EditIcon
															sx={{
																fontSize: 16,
																color: "var(--md-sys-color-tertiary)",
															}}
														/>
													)}
												</div>
											);
										})}
									</div>
								</div>
							</div>
						)}
					</div>
					{/* Footer */}
					<div className="flex items-center justify-end gap-3 p-4 border-t border-[var(--md-sys-color-outline-variant)]">
						<button onClick={onClose} className="md-text-button">
							Anuluj
						</button>
						<button
							onClick={onReject}
							disabled={loading || fetchLoading}
							className="md-outlined-button flex items-center gap-2 text-[var(--md-sys-color-error)] border-[var(--md-sys-color-error)] disabled:opacity-50"
						>
							<CancelIcon sx={{ fontSize: 18 }} />
							Odrzuć
						</button>
						<button
							onClick={onApprove}
							disabled={loading || fetchLoading}
							className="md-filled-button flex items-center gap-2 disabled:opacity-50"
						>
							{loading ? (
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
							) : (
								<CheckCircleIcon sx={{ fontSize: 18 }} />
							)}
							Zatwierdź
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
