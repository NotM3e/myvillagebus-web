"use client";

import { useState, useMemo } from "react";
import type { CreatorData } from "./ScheduleCreator";
import CheckIcon from "@mui/icons-material/Check";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventBusyIcon from "@mui/icons-material/EventBusy";

interface StepScheduleProps {
	data: CreatorData;
	updateData: (updates: Partial<CreatorData>) => void;
}

const DAYS_OF_WEEK = [
	{ key: "Pon", label: "Pn" },
	{ key: "Wt", label: "Wt" },
	{ key: "Śr", label: "Śr" },
	{ key: "Czw", label: "Cz" },
	{ key: "Pt", label: "Pt" },
	{ key: "Sob", label: "Sb" },
	{ key: "Nd", label: "Nd" },
] as const;

const PRESETS = [
	{ label: "Dni robocze", days: ["Pon", "Wt", "Śr", "Czw", "Pt"] },
	{ label: "Weekend", days: ["Sob", "Nd"] },
	{ label: "Codziennie", days: ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"] },
];

interface ParsedCourse {
	time: string;
	isValid: boolean;
	error?: string;
}

export default function StepSchedule({ data, updateData }: StepScheduleProps) {
	const [bulkText, setBulkText] = useState(data.departures);

	// Parse bulk entry text
	const parsedCourses = useMemo((): ParsedCourse[] => {
		if (!bulkText.trim()) return [];

		const lines = bulkText
			.split("\n")
			.map((l) => l.trim())
			.filter((l) => l);
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;

		return lines.map((line) => {
			// Try to extract time from various formats
			let time = line;

			// Remove common prefixes/suffixes
			time = time.replace(/^[-•*]\s*/, ""); // bullet points
			time = time.replace(/\s*[-–—]\s*.*$/, ""); // trailing notes

			// Check if it's a valid time
			if (timeRegex.test(time)) {
				// Normalize to HH:MM format
				const [hours, minutes] = time.split(":");
				const normalizedTime = `${hours.padStart(2, "0")}:${minutes}`;
				return { time: normalizedTime, isValid: true };
			}

			// Try to find time pattern in the line
			const timeMatch = line.match(/([0-1]?[0-9]|2[0-3]):([0-5][0-9])/);
			if (timeMatch) {
				const [hours, minutes] = timeMatch[0].split(":");
				const normalizedTime = `${hours.padStart(2, "0")}:${minutes}`;
				return { time: normalizedTime, isValid: true };
			}

			return { time: line, isValid: false, error: "Nieprawidłowy format godziny" };
		});
	}, [bulkText]);

	const validCourses = parsedCourses.filter((c) => c.isValid);
	const invalidCourses = parsedCourses.filter((c) => !c.isValid);

	const handleDayToggle = (day: string) => {
		const newDays = data.days.includes(day)
			? data.days.filter((d) => d !== day)
			: [...data.days, day];

		// Keep at least one day
		if (newDays.length > 0) {
			updateData({ days: newDays });
		}
	};

	const handlePreset = (presetDays: string[]) => {
		updateData({ days: presetDays });
	};

	const handleBulkChange = (text: string) => {
		setBulkText(text);
		updateData({ departures: text });
	};

	const handleExampleInsert = () => {
		const example = `06:30
07:15
08:00
12:30
14:45
16:20`;
		handleBulkChange(example);
	};

	return (
		<div className="space-y-8">
			{/* Section 1: Days */}
			<div>
				<h2 className="md-title-large mb-4">Dni kursowania</h2>

				{/* Presets */}
				<div className="flex flex-wrap gap-2 mb-4">
					{PRESETS.map((preset) => {
						const isActive =
							preset.days.every((d) => data.days.includes(d)) &&
							data.days.every((d) => preset.days.includes(d));
						return (
							<button
								key={preset.label}
								onClick={() => handlePreset(preset.days)}
								className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
									isActive
										? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
										: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
								}`}
							>
								{preset.label}
							</button>
						);
					})}
				</div>

				{/* Day buttons */}
				<div className="flex gap-2 justify-center">
					{DAYS_OF_WEEK.map((day) => {
						const isSelected = data.days.includes(day.key);
						return (
							<button
								key={day.key}
								onClick={() => handleDayToggle(day.key)}
								className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-colors ${
									isSelected
										? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
										: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
								}`}
							>
								{isSelected ? (
									<CheckIcon sx={{ fontSize: 18 }} />
								) : (
									<span className="md-label-medium">{day.label}</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Excludes holidays */}
				<div className="mt-4">
					<button
						onClick={() => updateData({ excludesHolidays: !data.excludesHolidays })}
						className={`w-full p-3 rounded-xl flex items-center gap-3 transition-colors ${
							data.excludesHolidays
								? "bg-[var(--md-sys-color-error-container)]"
								: "bg-[var(--md-sys-color-surface-variant)]"
						}`}
					>
						<EventBusyIcon
							sx={{
								fontSize: 24,
								color: data.excludesHolidays
									? "var(--md-sys-color-on-error-container)"
									: "var(--md-sys-color-on-surface-variant)",
							}}
						/>
						<div className="flex-1 text-left">
							<p
								className={`md-body-large ${
									data.excludesHolidays
										? "text-[var(--md-sys-color-on-error-container)]"
										: "text-[var(--md-sys-color-on-surface)]"
								}`}
							>
								Nie kursuje w święta
							</p>
							<p
								className={`md-body-small ${
									data.excludesHolidays
										? "text-[var(--md-sys-color-on-error-container)]"
										: "text-[var(--md-sys-color-on-surface-variant)]"
								}`}
							>
								Autobus nie jeździ w dni ustawowo wolne
							</p>
						</div>
						<div
							className={`w-6 h-6 rounded-md flex items-center justify-center ${
								data.excludesHolidays
									? "bg-[var(--md-sys-color-error)] text-white"
									: "border-2 border-[var(--md-sys-color-outline)]"
							}`}
						>
							{data.excludesHolidays && <CheckIcon sx={{ fontSize: 16 }} />}
						</div>
					</button>
				</div>
			</div>

			{/* Section 2: Departures (Bulk Entry) */}
			<div>
				<div className="flex items-center justify-between mb-4">
					<h2 className="md-title-large">Godziny odjazdów</h2>
					<button onClick={handleExampleInsert} className="md-text-button text-sm">
						Wstaw przykład
					</button>
				</div>

				<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-3">
					Wpisz godziny odjazdu z pierwszego przystanku ({data.stops[0]?.city || "?"}).
					Każda godzina w nowej linii.
				</p>

				{/* Bulk entry textarea */}
				<textarea
					value={bulkText}
					onChange={(e) => handleBulkChange(e.target.value)}
					placeholder={`np.\n06:30\n07:15\n08:00`}
					rows={8}
					className="w-full px-4 py-3 rounded-xl bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)] placeholder:text-[var(--md-sys-color-on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-mono text-sm resize-none"
				/>

				{/* Parse results */}
				{parsedCourses.length > 0 && (
					<div className="mt-4 space-y-3">
						{/* Valid courses */}
						{validCourses.length > 0 && (
							<div className="p-3 rounded-xl bg-[var(--md-sys-color-primary-container)]">
								<div className="flex items-center gap-2 mb-2">
									<AccessTimeIcon
										sx={{
											fontSize: 18,
											color: "var(--md-sys-color-on-primary-container)",
										}}
									/>
									<span className="md-label-large text-[var(--md-sys-color-on-primary-container)]">
										Rozpoznano {validCourses.length}{" "}
										{validCourses.length === 1
											? "kurs"
											: validCourses.length < 5
												? "kursy"
												: "kursów"}
									</span>
								</div>
								<div className="flex flex-wrap gap-2">
									{validCourses.map((course, index) => (
										<span
											key={index}
											className="px-2 py-1 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-sm font-mono"
										>
											{course.time}
										</span>
									))}
								</div>
							</div>
						)}

						{/* Invalid lines */}
						{invalidCourses.length > 0 && (
							<div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)]">
								<div className="flex items-center gap-2 mb-2">
									<WarningAmberIcon
										sx={{
											fontSize: 18,
											color: "var(--md-sys-color-on-error-container)",
										}}
									/>
									<span className="md-label-large text-[var(--md-sys-color-on-error-container)]">
										{invalidCourses.length}{" "}
										{invalidCourses.length === 1 ? "błąd" : "błędów"}
									</span>
								</div>
								<div className="space-y-1">
									{invalidCourses.map((course, index) => (
										<p
											key={index}
											className="md-body-small text-[var(--md-sys-color-on-error-container)]"
										>
											"{course.time}" - {course.error}
										</p>
									))}
								</div>
							</div>
						)}
					</div>
				)}

				{/* Help */}
				{parsedCourses.length === 0 && (
					<p className="mt-3 md-body-small text-[var(--md-sys-color-on-surface-variant)] text-center">
						Wpisz co najmniej jedną godzinę, aby kontynuować
					</p>
				)}
			</div>

			{/* Summary */}
			{validCourses.length > 0 && data.days.length > 0 && (
				<div className="p-4 rounded-xl bg-[var(--md-sys-color-secondary-container)]">
					<h3 className="md-title-medium text-[var(--md-sys-color-on-secondary-container)] mb-2">
						Podsumowanie
					</h3>
					<ul className="space-y-1 md-body-medium text-[var(--md-sys-color-on-secondary-container)]">
						<li>
							• Kierunek: <strong>{data.direction}</strong>
						</li>
						<li>
							• Dni: <strong>{data.days.join(", ")}</strong>
						</li>
						<li>
							• Kursów: <strong>{validCourses.length}</strong>
						</li>
						<li>
							• Przystanków: <strong>{data.stops.length}</strong>
						</li>
						{data.excludesHolidays && (
							<li className="text-[var(--md-sys-color-error)]">
								• Nie kursuje w święta
							</li>
						)}
					</ul>
				</div>
			)}
		</div>
	);
}
