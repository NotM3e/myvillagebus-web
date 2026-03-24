"use client";

import { useState, useEffect, useMemo } from "react";
import { getSchedulesForCopy, type ScheduleForCopy } from "@/lib/supabase/queries";
import type { CreatorData } from "./ScheduleCreator";

import CloseIcon from "@mui/icons-material/Close";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface CopyFromScheduleModalProps {
	isOpen: boolean;
	onClose: () => void;
	carrierId: string;
	lineId: string | null;
	mode: "stops" | "times";
	onCopyStops: (stops: CreatorData["stops"], direction: string) => void;
	onCopyTimes: (departures: string) => void;
}

export default function CopyFromScheduleModal({
	isOpen,
	onClose,
	carrierId,
	lineId,
	mode,
	onCopyStops,
	onCopyTimes,
}: CopyFromScheduleModalProps) {
	const [schedules, setSchedules] = useState<ScheduleForCopy[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [reverseStops, setReverseStops] = useState(false);

	// Fetch schedules when modal opens
	useEffect(() => {
		if (!isOpen) return;

		setLoading(true);
		setSelectedId(null);
		setReverseStops(false);

		getSchedulesForCopy(carrierId, lineId || undefined).then((data) => {
			setSchedules(data);
			setLoading(false);
		});
	}, [isOpen, carrierId, lineId]);

	const selected = useMemo(
		() => schedules.find((s) => s.id === selectedId) || null,
		[schedules, selectedId]
	);

	const previewStops = useMemo(() => {
		if (!selected) return [];
		const stops = [...selected.stops];
		if (reverseStops) stops.reverse();
		return stops;
	}, [selected, reverseStops]);

	const previewDirection = useMemo(() => {
		if (!selected) return "";
		if (!reverseStops) return selected.direction;

		// Try to reverse direction string with various separators
		const separators = [" → ", " -> ", " - ", " do "];
		for (const sep of separators) {
			if (selected.direction.includes(sep)) {
				const parts = selected.direction.split(sep);
				if (parts.length === 2) {
					return `${parts[1].trim()} → ${parts[0].trim()}`;
				}
			}
		}

		// Fallback: generate from reversed stops
		if (previewStops.length >= 2) {
			return `${previewStops[0].city} → ${previewStops[previewStops.length - 1].city}`;
		}
		return selected.direction;
	}, [selected, reverseStops, previewStops]);

	const handleCopy = () => {
		if (!selected) return;

		if (mode === "stops") {
			const stops: CreatorData["stops"] = previewStops.map((s) => ({
				id: s.id,
				city: s.city,
				name: s.name,
				isNew: false,
			}));
			onCopyStops(stops, previewDirection);
		} else {
			const timesText = selected.departureTimes.join("\n");
			onCopyTimes(timesText);
		}

		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />

			{/* Modal */}
			<div className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-2xl max-h-[90vh] overflow-hidden">
				<div className="bg-[var(--md-sys-color-surface)] rounded-3xl shadow-xl flex flex-col max-h-[90vh]">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)]">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-secondary-container)] flex items-center justify-center">
								<ContentCopyIcon
									sx={{
										fontSize: 20,
										color: "var(--md-sys-color-on-secondary-container)",
									}}
								/>
							</div>
							<h2 className="md-title-large">
								{mode === "stops" ? "Kopiuj przystanki" : "Kopiuj godziny"}
							</h2>
						</div>
						<button
							onClick={onClose}
							className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
						>
							<CloseIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
						</button>
					</div>

					{/* Content */}
					<div className="flex-1 overflow-y-auto p-4">
						{loading ? (
							<div className="flex items-center justify-center py-12">
								<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
							</div>
						) : schedules.length === 0 ? (
							<div className="text-center py-12">
								<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)]">
									Brak rozkładów do skopiowania.
								</p>
								<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] mt-2">
									Utwórz pierwszy kurs dla tej linii.
								</p>
							</div>
						) : (
							<div className="space-y-6">
								{/* Schedule list */}
								<div>
									<p className="md-label-large text-[var(--md-sys-color-on-surface-variant)] mb-3">
										Wybierz kurs do skopiowania
									</p>
									<div className="space-y-2 max-h-60 overflow-y-auto">
										{schedules.map((schedule) => {
											const isSelected = selectedId === schedule.id;

											return (
												<button
													key={schedule.id}
													onClick={() =>
														setSelectedId(
															isSelected ? null : schedule.id
														)
													}
													className={`w-full p-3 rounded-xl text-left transition-colors ${
														isSelected
															? "ring-2 ring-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)]"
															: "bg-[var(--md-sys-color-surface-variant)] hover:bg-[var(--md-sys-color-outline-variant)]"
													}`}
												>
													{/* Line + status */}
													<div className="flex items-center justify-between mb-1">
														<div className="flex items-center gap-2">
															<p className="md-title-small">
																Linia {schedule.lineNumber}
															</p>
															<span
																className={`px-2 py-0.5 rounded-full text-xs ${
																	schedule.status === "active"
																		? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
																		: "bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]"
																}`}
															>
																{schedule.status === "active"
																	? "Aktywny"
																	: "Oczekuje"}
															</span>
														</div>
														{schedule.departureTimes.length > 0 && (
															<div className="flex items-center gap-1">
																<AccessTimeIcon
																	sx={{
																		fontSize: 14,
																		color: "var(--md-sys-color-on-surface-variant)",
																	}}
																/>
																<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
																	{schedule.departureTimes
																		.slice(0, 3)
																		.join(", ")}
																	{schedule.departureTimes
																		.length > 3 &&
																		` +${schedule.departureTimes.length - 3}`}
																</span>
															</div>
														)}
													</div>

													{/* Direction */}
													<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
														{schedule.direction}
													</p>

													{/* Days */}
													<div className="flex flex-wrap gap-1 mt-1">
														{schedule.days.map((day) => (
															<span
																key={day}
																className="px-1.5 py-0.5 text-xs rounded bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface-variant)]"
															>
																{day}
															</span>
														))}
													</div>

													{/* Stop count */}
													<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mt-1">
														{schedule.stops.length} przystanków
													</p>
												</button>
											);
										})}
									</div>
								</div>

								{/* Preview (visible when schedule selected) */}
								{selected && (
									<div className="border-t border-[var(--md-sys-color-outline-variant)] pt-4">
										<div className="flex items-center justify-between mb-3">
											<p className="md-title-medium">Podgląd</p>
											{mode === "stops" && (
												<button
													onClick={() => setReverseStops(!reverseStops)}
													className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors ${
														reverseStops
															? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
															: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
													}`}
												>
													<SwapVertIcon sx={{ fontSize: 16 }} />
													Odwróć kolejność
												</button>
											)}
										</div>

										{/* Direction */}
										<div className="p-2 rounded-lg bg-[var(--md-sys-color-primary-container)] mb-3">
											<p className="md-body-medium text-[var(--md-sys-color-on-primary-container)]">
												Kierunek: <strong>{previewDirection}</strong>
											</p>
										</div>

										{mode === "stops" ? (
											/* Stop timeline preview */
											<div className="relative">
												{previewStops.map((stop, index) => {
													const isFirst = index === 0;
													const isLast =
														index === previewStops.length - 1;

													return (
														<div
															key={`${stop.id}-${index}`}
															className={`relative flex items-start gap-3 ${!isLast ? "pb-4" : ""}`}
														>
															{/* Timeline connector */}
															{!isLast && (
																<div className="absolute left-[11px] top-6 w-0.5 h-[calc(100%-12px)] bg-[var(--md-sys-color-primary)]" />
															)}

															{/* Dot */}
															<div className="relative z-10 flex-shrink-0">
																{isFirst || isLast ? (
																	<div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-primary)] flex items-center justify-center">
																		<FiberManualRecordIcon
																			sx={{
																				fontSize: 12,
																				color: "var(--md-sys-color-on-primary)",
																			}}
																		/>
																	</div>
																) : (
																	<div className="w-6 h-6 rounded-full border-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)]" />
																)}
															</div>

															{/* Stop info */}
															<div className="flex-1">
																<p className="md-body-medium">
																	{stop.city}
																</p>
																{stop.name && (
																	<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
																		{stop.name}
																	</p>
																)}
															</div>

															{/* Offset or placeholder */}
															<span className="px-2 py-1 rounded-lg bg-[var(--md-sys-color-surface-variant)] md-body-small text-[var(--md-sys-color-on-surface-variant)]">
																{reverseStops
																	? "--:--"
																	: `+${stop.offsetMinutes}min`}
															</span>
														</div>
													);
												})}
											</div>
										) : (
											/* Times preview */
											<div className="flex flex-wrap gap-2">
												{selected.departureTimes.map((time, i) => (
													<span
														key={i}
														className="px-3 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-sm font-mono"
													>
														{time}
													</span>
												))}
												{selected.departureTimes.length === 0 && (
													<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
														Brak godzin do skopiowania
													</p>
												)}
											</div>
										)}
									</div>
								)}
							</div>
						)}
					</div>

					{/* Footer */}
					<div className="flex items-center justify-end gap-2 p-4 border-t border-[var(--md-sys-color-outline-variant)]">
						<button onClick={onClose} className="md-text-button">
							Anuluj
						</button>
						<button
							onClick={handleCopy}
							disabled={
								!selected ||
								(mode === "times" && selected.departureTimes.length === 0)
							}
							className="md-filled-button flex items-center gap-2 disabled:opacity-50"
						>
							<ContentCopyIcon sx={{ fontSize: 18 }} />
							Kopiuj
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
