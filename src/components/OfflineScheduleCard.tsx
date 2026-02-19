"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { OfflineScheduleWithDetails } from "@/lib/db/hooks";
import { getTodayHolidayInfo } from "@/lib/holidays";
import { createClient } from "@/lib/supabase/client";
import { submitReport } from "@/lib/supabase/mutations";
import { User } from "@supabase/supabase-js";
import ReportModal from "./ReportModal";

import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/Pending";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

interface OfflineScheduleCardProps {
	schedule: OfflineScheduleWithDetails;
	displayTime?: string | null;
	fromStopId?: string | null;
}

type VoteState = "none" | "up" | "down";

export default function OfflineScheduleCard({
	schedule,
	displayTime,
	fromStopId,
}: OfflineScheduleCardProps) {
	const [user, setUser] = useState<User | null>(null);
	const [voteState, setVoteState] = useState<VoteState>("none");
	const [localScore, setLocalScore] = useState(schedule.netScore);
	const [showReportModal, setShowReportModal] = useState(false);

	// Check auth status
	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});
	}, []);

	// Holiday warning
	const holidayInfo = getTodayHolidayInfo();
	const showHolidayWarning = schedule.excludesHolidays && holidayInfo.isHoliday;

	const formatTime = (time: string | null) => {
		if (!time) return "--:--";
		return time.slice(0, 5);
	};

	// Build detail page URL
	const detailsUrl = fromStopId
		? `/app/schedule/${schedule.id}?fromStopId=${fromStopId}`
		: `/app/schedule/${schedule.id}`;

	const handleVote = (vote: "up" | "down", e: React.MouseEvent) => {
		e.preventDefault(); // Prevent Link navigation
		e.stopPropagation();

		if (!user) {
			// TODO: Show login prompt
			alert("Zaloguj się, aby głosować");
			return;
		}

		if (voteState === vote) {
			// Remove vote
			setVoteState("none");
			setLocalScore(schedule.netScore);
		} else {
			// Change vote
			const scoreDiff = voteState === "none" ? 1 : 2;
			setVoteState(vote);
			setLocalScore((prev) => (vote === "up" ? prev + scoreDiff : prev - scoreDiff));
		}

		// TODO: Sync vote to Supabase
	};

	const handleReportClick = (e: React.MouseEvent) => {
		e.preventDefault();
		e.stopPropagation();

		if (!user) {
			alert("Zaloguj się, aby zgłosić problem");
			return;
		}

		setShowReportModal(true);
	};

	const handleReportSubmit = async (data: {
		reasonId: string;
		type: "data_error" | "trolling";
		comment: string;
	}) => {
		if (!user) throw new Error("Nie zalogowano");

		const result = await submitReport(
			{
				scheduleId: schedule.id,
				reasonId: data.reasonId,
				type: data.type,
				comment: data.comment,
			},
			user.id
		);

		if (!result.success) {
			throw new Error(result.error || "Błąd wysyłania zgłoszenia");
		}
	};

	// Status styling
	const getStatusStyle = () => {
		if (schedule.status === "pending") {
			return {
				borderColor: "var(--md-sys-color-tertiary)",
				badgeBg: "var(--md-sys-color-tertiary-container)",
				badgeText: "var(--md-sys-color-on-tertiary-container)",
				label: "Oczekuje",
				icon: <PendingIcon sx={{ fontSize: 14 }} />,
			};
		}

		if (schedule.isVerified) {
			return {
				borderColor: "var(--md-sys-color-primary)",
				badgeBg: "var(--md-sys-color-primary-container)",
				badgeText: "var(--md-sys-color-on-primary-container)",
				label: "Zweryfikowany",
				icon: <VerifiedIcon sx={{ fontSize: 14 }} />,
			};
		}

		return {
			borderColor: "var(--md-sys-color-secondary)",
			badgeBg: "var(--md-sys-color-secondary-container)",
			badgeText: "var(--md-sys-color-on-secondary-container)",
			label: "Społecznościowy",
			icon: <PersonOutlineIcon sx={{ fontSize: 14 }} />,
		};
	};

	const status = getStatusStyle();

	return (
		<>
			<div
				className="md-card md-elevation-1 mb-4 border-l- overflow-hidden"
				style={{ borderLeftColor: status.borderColor }}
			>
				{/* Clickable area - Header + Body */}
				<Link href={detailsUrl} className="block p-4 pb-2">
					{/* Header */}
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
							<DirectionsBusIcon
								sx={{
									fontSize: 24,
									color: "var(--md-sys-color-on-primary-container)",
								}}
							/>
						</div>
						<div className="flex-1">
							<div className="flex items-center gap-2">
								<p className="md-title-medium">{schedule.carrierName}</p>
								{schedule.carrierVerified && (
									<VerifiedIcon
										sx={{ fontSize: 16, color: "var(--md-sys-color-primary)" }}
									/>
								)}
							</div>
							<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
								Linia {schedule.lineNumber}
							</p>
						</div>

						{/* Departure time */}
						<div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--md-sys-color-primary-container)]">
							<AccessTimeIcon
								sx={{
									fontSize: 18,
									color: "var(--md-sys-color-on-primary-container)",
								}}
							/>
							<span className="md-title-medium text-[var(--md-sys-color-on-primary-container)]">
								{displayTime ?? formatTime(schedule.firstDeparture)}
							</span>
						</div>
					</div>

					{/* Seletion*/}
					<div className="flex items-center">
						{/* Direction */}
						<p className="flex-1 md-body-large mt-3 mb-2">{schedule.direction}</p>

						{/* Status badge */}
						<div className="flex items-center gap-2">
							<span
								className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
								style={{
									backgroundColor: status.badgeBg,
									color: status.badgeText,
								}}
							>
								{status.icon}
								{status.label}
							</span>
						</div>
					</div>

					{/* Holiday warning */}
					{showHolidayWarning && (
						<div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-[var(--md-sys-color-error-container)]">
							<WarningAmberIcon
								sx={{
									fontSize: 18,
									color: "var(--md-sys-color-on-error-container)",
								}}
							/>
							<p className="md-body-small text-[var(--md-sys-color-on-error-container)]">
								Prawdopodobnie nie kursuje - {holidayInfo.name}
							</p>
						</div>
					)}
				</Link>

				{/* Footer: Score + Actions - NOT clickable for navigation */}
				<div className="px-4">
					<div className="flex items-center justify-between border-t border-[var(--md-sys-color-outline-variant)]">
						{/* Score */}
						<div className="flex items-center gap-1">
							<span
								className={`md-label-large ${
									localScore > 0
										? "text-[var(--md-sys-color-primary)]"
										: localScore < 0
											? "text-[var(--md-sys-color-error)]"
											: "text-[var(--md-sys-color-on-surface-variant)]"
								}`}
							>
								{localScore > 0 ? "+" : ""}
								{localScore}
							</span>
							<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
								pkt
							</span>
						</div>

						{/* Actions */}
						<div className="flex items-center gap-1">
							{/* Upvote */}
							<button
								onClick={(e) => handleVote("up", e)}
								className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
								title="Aktualny"
							>
								{voteState === "up" ? (
									<ThumbUpIcon
										sx={{ fontSize: 20, color: "var(--md-sys-color-primary)" }}
									/>
								) : (
									<ThumbUpOutlinedIcon
										sx={{
											fontSize: 20,
											color: "var(--md-sys-color-on-surface-variant)",
										}}
									/>
								)}
							</button>

							{/* Downvote */}
							<button
								onClick={(e) => handleVote("down", e)}
								className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
								title="Nieaktualny"
							>
								{voteState === "down" ? (
									<ThumbDownIcon
										sx={{ fontSize: 20, color: "var(--md-sys-color-error)" }}
									/>
								) : (
									<ThumbDownOutlinedIcon
										sx={{
											fontSize: 20,
											color: "var(--md-sys-color-on-surface-variant)",
										}}
									/>
								)}
							</button>

							{/* Report */}
							<button
								onClick={handleReportClick}
								className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
								title="Zgłoś problem"
							>
								<FlagOutlinedIcon
									sx={{
										fontSize: 20,
										color: "var(--md-sys-color-on-surface-variant)",
									}}
								/>
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Report Modal */}
			<ReportModal
				isOpen={showReportModal}
				onClose={() => setShowReportModal(false)}
				scheduleId={schedule.id}
				scheduleName={`${schedule.carrierName} - ${schedule.direction}`}
				onSubmit={handleReportSubmit}
			/>
		</>
	);
}
