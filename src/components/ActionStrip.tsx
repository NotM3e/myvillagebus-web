"use client";

import { useState } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TodayIcon from "@mui/icons-material/Today";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

const DAYS_OF_WEEK = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"] as const;

interface ActionStripProps {
	selectedDays: string[];
	onDaysChange: (days: string[]) => void;
	showPending: boolean;
	onShowPendingChange: (show: boolean) => void;
	timeFilter: "all" | "now" | "custom";
	onTimeFilterChange: (filter: "all" | "now" | "custom") => void;
	selectedTime: string | null;
	onSelectedTimeChange: (time: string | null) => void;
}

export default function ActionStrip({
	selectedDays,
	onDaysChange,
	showPending,
	onShowPendingChange,
	timeFilter,
	onTimeFilterChange,
	selectedTime,
	onSelectedTimeChange,
}: ActionStripProps) {
	const [showDayPicker, setShowDayPicker] = useState(false);
	const [showTimePicker, setShowTimePicker] = useState(false);

	const getCurrentDayName = () => {
		const dayIndex = new Date().getDay();
		const polishDayIndex = dayIndex === 0 ? 6 : dayIndex - 1;
		return DAYS_OF_WEEK[polishDayIndex];
	};

	const getCurrentTime = () => {
		const now = new Date();
		return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
	};

	const handleNowClick = () => {
		if (timeFilter === "now") {
			// Toggle off - reset
			onDaysChange([...DAYS_OF_WEEK]);
			onSelectedTimeChange(null);
			onTimeFilterChange("all");
		} else {
			// Toggle on - set current day + time
			const today = getCurrentDayName();
			onDaysChange([today]);
			onSelectedTimeChange(getCurrentTime());
			onTimeFilterChange("now");
		}
		setShowDayPicker(false);
		setShowTimePicker(false);
	};

	const handleDayToggle = (day: string) => {
		if (selectedDays.includes(day)) {
			if (selectedDays.length > 1) {
				onDaysChange(selectedDays.filter((d) => d !== day));
			}
		} else {
			onDaysChange([...selectedDays, day]);
		}
		onTimeFilterChange("custom");
	};

	const handleQuickDays = (preset: "weekdays" | "weekend" | "all") => {
		switch (preset) {
			case "weekdays":
				onDaysChange(["Pon", "Wt", "Śr", "Czw", "Pt"]);
				break;
			case "weekend":
				onDaysChange(["Sob", "Nd"]);
				break;
			case "all":
				onDaysChange([...DAYS_OF_WEEK]);
				break;
		}
		onTimeFilterChange("custom");
		setShowDayPicker(false);
	};

	const handleTimeChange = (time: string) => {
		onSelectedTimeChange(time);
		onTimeFilterChange("custom");
	};

	const handleTimeClear = () => {
		onSelectedTimeChange(null);
		if (selectedDays.length === 7) {
			onTimeFilterChange("all");
		} else {
			onTimeFilterChange("custom");
		}
		setShowTimePicker(false);
	};

	const getDaysLabel = () => {
		if (selectedDays.length === 7) return "Wszystkie dni";
		if (
			selectedDays.length === 5 &&
			selectedDays.includes("Pon") &&
			selectedDays.includes("Pt") &&
			!selectedDays.includes("Sob")
		) {
			return "Dni robocze";
		}
		if (selectedDays.length === 2 && selectedDays.includes("Sob") && selectedDays.includes("Nd")) {
			return "Weekend";
		}
		if (selectedDays.length === 1) return selectedDays[0];
		return `${selectedDays.length} dni`;
	};

	const getTimeLabel = () => {
		if (!selectedTime) return "Godzina";
		return `od ${selectedTime}`;
	};

	return (
		<div className="mb-4">
			{/* Main action buttons - horizontal scroll */}
			<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
				{/* Teraz */}
				<button
					onClick={handleNowClick}
					className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
						timeFilter === "now"
							? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
							: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
					}`}
				>
					<AccessTimeIcon sx={{ fontSize: 18 }} />
					<span className="md-label-large">Teraz</span>
				</button>

				{/* Godzina */}
				<button
					onClick={() => {
						setShowTimePicker(!showTimePicker);
						setShowDayPicker(false);
					}}
					className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
						selectedTime
							? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
							: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
					}`}
				>
					<ScheduleIcon sx={{ fontSize: 18 }} />
					<span className="md-label-large">{getTimeLabel()}</span>
				</button>

				{/* Dzień */}
				<button
					onClick={() => {
						setShowDayPicker(!showDayPicker);
						setShowTimePicker(false);
					}}
					className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
						showDayPicker
							? "bg-[var(--md-sys-color-secondary)] text-[var(--md-sys-color-on-secondary)]"
							: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
					}`}
				>
					<TodayIcon sx={{ fontSize: 18 }} />
					<span className="md-label-large">{getDaysLabel()}</span>
				</button>

				{/* Kalendarz - placeholder */}
				<button
					disabled
					className="flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] opacity-50"
				>
					<CalendarMonthIcon sx={{ fontSize: 18 }} />
					<span className="md-label-large">Kalendarz</span>
				</button>

				{/* Pending toggle */}
				<button
					onClick={() => onShowPendingChange(!showPending)}
					className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
						showPending
							? "bg-[var(--md-sys-color-tertiary)] text-[var(--md-sys-color-on-tertiary)]"
							: "bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)]"
					}`}
				>
					<PendingActionsIcon sx={{ fontSize: 18 }} />
					<span className="md-label-large">Pending</span>
				</button>
			</div>

			{/* Time picker dropdown */}
			{showTimePicker && (
				<div className="mt-3 p-4 rounded-xl bg-[var(--md-sys-color-surface-variant)]">
					<div className="flex items-center gap-3">
						<label className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
							Pokaż odjazdy od:
						</label>
						<input
							type="time"
							value={selectedTime ?? ""}
							onChange={(e) => handleTimeChange(e.target.value)}
							className="px-3 py-2 rounded-lg bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
						/>
						{selectedTime && (
							<button
								onClick={handleTimeClear}
								className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface)] transition-colors"
								title="Wyczyść"
							>
								<CloseIcon sx={{ fontSize: 18, color: "var(--md-sys-color-on-surface-variant)" }} />
							</button>
						)}
					</div>
				</div>
			)}

			{/* Day picker dropdown */}
			{showDayPicker && (
				<div className="mt-3 p-4 rounded-xl bg-[var(--md-sys-color-surface-variant)]">
					{/* Quick presets */}
					<div className="flex gap-2 mb-3">
						<button
							onClick={() => handleQuickDays("weekdays")}
							className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
						>
							Dni robocze
						</button>
						<button
							onClick={() => handleQuickDays("weekend")}
							className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
						>
							Weekend
						</button>
						<button
							onClick={() => handleQuickDays("all")}
							className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
						>
							Wszystkie
						</button>
					</div>

					{/* Individual days */}
					<div className="flex flex-wrap gap-2">
						{DAYS_OF_WEEK.map((day) => {
							const isSelected = selectedDays.includes(day);
							return (
								<button
									key={day}
									onClick={() => handleDayToggle(day)}
									className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
										isSelected
											? "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]"
											: "bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)]"
									}`}
								>
									{isSelected ? (
										<CheckIcon sx={{ fontSize: 20 }} />
									) : (
										<span className="md-label-large">{day}</span>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
