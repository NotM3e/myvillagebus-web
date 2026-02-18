"use client";

import type { ActiveScheduleView } from "@/types/database";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VerifiedIcon from "@mui/icons-material/Verified";

interface ScheduleCardProps {
	schedule: ActiveScheduleView;
}

export default function ScheduleCard({ schedule }: ScheduleCardProps) {
	// Format time HH:MM from HH:MM:SS
	const formatTime = (time: string | null) => {
		if (!time) return "--:--";
		return time.slice(0, 5);
	};

	return (
		<div className="md-card md-elevation-1 p-4 mb-4">
			{/* Header */}
			<div className="flex items-center gap-3">
				<div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
					<DirectionsBusIcon
						sx={{ fontSize: 24, color: "var(--md-sys-color-on-primary-container)" }}
					/>
				</div>
				<div className="flex-1">
					<div className="flex items-center gap-2">
						<p className="md-title-medium">{schedule.carrier_name}</p>
						{schedule.carrier_verified && (
							<VerifiedIcon
								sx={{ fontSize: 16, color: "var(--md-sys-color-primary)" }}
							/>
						)}
					</div>
					<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
						Linia {schedule.line_number}
					</p>
				</div>

				{/* Departure time */}
				<div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--md-sys-color-primary-container)]">
					<AccessTimeIcon
						sx={{ fontSize: 18, color: "var(--md-sys-color-on-primary-container)" }}
					/>
					<span className="md-title-medium text-[var(--md-sys-color-on-primary-container)]">
						{formatTime(schedule.first_departure)}
					</span>
				</div>
			</div>

			{/* Direction */}
			<p className="md-body-large mt-3 mb-2">{schedule.direction}</p>

			{/* Days */}
			<div className="flex flex-wrap gap-1">
				{schedule.days.map((day) => (
					<span
						key={day}
						className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
					>
						{day}
					</span>
				))}
				{schedule.excludes_holidays && (
					<span className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
						bez świąt
					</span>
				)}
			</div>
		</div>
	);
}
