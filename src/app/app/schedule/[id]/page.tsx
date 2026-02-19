"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import ReportModal from "@/components/ReportModal";
import { useScheduleDetails } from "@/lib/db/hooks";
import { getTodayHolidayInfo } from "@/lib/holidays";
import {
	getUserVote,
	voteOnSchedule,
	removeVote,
	getScheduleNetScore,
} from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/client";
import { submitReport } from "@/lib/supabase/mutations";
import { User } from "@supabase/supabase-js";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import VerifiedIcon from "@mui/icons-material/Verified";
import PendingIcon from "@mui/icons-material/Pending";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownOutlinedIcon from "@mui/icons-material/ThumbDownOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PlaceIcon from "@mui/icons-material/Place";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface PageProps {
	params: Promise<{ id: string }>;
}

type VoteState = "none" | "up" | "down";

export default function ScheduleDetailsPage({ params }: PageProps) {
	const { id: scheduleId } = use(params);
	const searchParams = useSearchParams();
	const fromStopId = searchParams.get("fromStopId");

	const { schedule, line, stops, loading, error } = useScheduleDetails(scheduleId);

	const [user, setUser] = useState<User | null>(null);
	const [voteState, setVoteState] = useState<VoteState>("none");
	const [localScore, setLocalScore] = useState(0);
	const [voteLoading, setVoteLoading] = useState(false);
	const [showReportModal, setShowReportModal] = useState(false);

	// Auth and load existing vote with fresh score
	useEffect(() => {
		const supabase = createClient();
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);

			if (session?.user) {
				// Fetch vote and fresh score from Supabase
				Promise.all([getUserVote(scheduleId), getScheduleNetScore(scheduleId)]).then(
					([vote, netScore]) => {
						setLocalScore(netScore);
						if (vote) {
							setVoteState(vote.vote_type === "positive" ? "up" : "down");
						}
					}
				);
			}
		});
	}, [scheduleId]);

	// Sync localScore when schedule loads
	useEffect(() => {
		if (schedule) {
			setLocalScore(schedule.netScore);
		}
	}, [schedule]);

	// Holiday warning
	const holidayInfo = getTodayHolidayInfo();
	const showHolidayWarning = schedule?.excludesHolidays && holidayInfo.isHoliday;

	// Status styling
	const getStatusStyle = () => {
		if (!schedule) return null;

		if (schedule.status === "pending") {
			return {
				borderColor: "var(--md-sys-color-tertiary)",
				badgeBg: "var(--md-sys-color-tertiary-container)",
				badgeText: "var(--md-sys-color-on-tertiary-container)",
				label: "Oczekuje na weryfikację",
				icon: <PendingIcon sx={{ fontSize: 16 }} />,
			};
		}

		if (schedule.isVerified) {
			return {
				borderColor: "var(--md-sys-color-primary)",
				badgeBg: "var(--md-sys-color-primary-container)",
				badgeText: "var(--md-sys-color-on-primary-container)",
				label: "Zweryfikowany",
				icon: <VerifiedIcon sx={{ fontSize: 16 }} />,
			};
		}

		return {
			borderColor: "var(--md-sys-color-secondary)",
			badgeBg: "var(--md-sys-color-secondary-container)",
			badgeText: "var(--md-sys-color-on-secondary-container)",
			label: "Społecznościowy",
			icon: <PersonOutlineIcon sx={{ fontSize: 16 }} />,
		};
	};

	const status = getStatusStyle();

	// Voting handlers
	const handleVote = async (vote: "up" | "down") => {
		if (!user) {
			alert("Zaloguj się, aby głosować");
			return;
		}

		if (!schedule || voteLoading) return;
		setVoteLoading(true);

		try {
			if (voteState === vote) {
				// Remove vote
				const result = await removeVote(scheduleId);
				if (result.success) {
					setVoteState("none");
					setLocalScore(schedule.netScore);
				}
			} else {
				// Add or change vote
				const voteType = vote === "up" ? "positive" : "negative";
				const result = await voteOnSchedule(scheduleId, voteType);
				if (result.success) {
					const scoreDiff = voteState === "none" ? 1 : 2;
					setVoteState(vote);
					setLocalScore((prev) => (vote === "up" ? prev + scoreDiff : prev - scoreDiff));
				}
			}
		} catch (err) {
			console.error("Vote error:", err);
		} finally {
			setVoteLoading(false);
		}
	};

	const handleReport = () => {
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
				scheduleId,
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

	const handleEdit = () => {
		// TODO: Navigate to edit mode
		alert("Funkcja edycji wkrótce");
	};

	// Loading state
	if (loading) {
		return (
			<PageWrapper maxWidth="max-w-2xl">
				<div className="flex items-center gap-4 mb-6">
					<Link
						href="/app"
						className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
					>
						<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
					</Link>
					<h1 className="md-title-large">Szczegóły kursu</h1>
				</div>

				<div className="text-center py-12">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
						Ładowanie...
					</p>
				</div>
			</PageWrapper>
		);
	}

	// Error/Not found state
	if (error || !schedule || !line) {
		return (
			<PageWrapper maxWidth="max-w-2xl">
				<div className="flex items-center gap-4 mb-6">
					<Link
						href="/app"
						className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
					>
						<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
					</Link>
					<h1 className="md-title-large">Szczegóły kursu</h1>
				</div>

				<div className="text-center py-12">
					<p className="md-body-large text-[var(--md-sys-color-error)]">
						{error || "Nie znaleziono rozkładu"}
					</p>
					<Link href="/app" className="md-text-button mt-4 inline-block">
						Wróć do rozkładów
					</Link>
				</div>
			</PageWrapper>
		);
	}

	return (
		<PageWrapper maxWidth="max-w-2xl">
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<Link
					href="/app"
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
				>
					<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
				</Link>
				<h1 className="md-title-large">Szczegóły kursu</h1>
			</div>

			{/* Main info card */}
			<div
				className="md-card md-elevation-1 p-4 mb-4 border-l-4"
				style={{ borderLeftColor: status?.borderColor }}
			>
				{/* Carrier + Line */}
				<div className="flex items-center gap-3 mb-3">
					<div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
						<DirectionsBusIcon
							sx={{ fontSize: 28, color: "var(--md-sys-color-on-primary-container)" }}
						/>
					</div>
					<div className="flex-1">
						<div className="flex items-center gap-2">
							<p className="md-title-medium">{line.carrierName}</p>
							{line.carrierVerified && (
								<VerifiedIcon
									sx={{ fontSize: 16, color: "var(--md-sys-color-primary)" }}
								/>
							)}
						</div>
						<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
							Linia {line.number}
						</p>
					</div>
				</div>

				{/* Direction */}
				<p className="md-title-large mb-3">{schedule.direction}</p>

				{/* Status badge */}
				{status && (
					<div className="flex items-center gap-2 mb-3">
						<span
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
							style={{
								backgroundColor: status.badgeBg,
								color: status.badgeText,
							}}
						>
							{status.icon}
							{status.label}
						</span>
					</div>
				)}

				{/* Days */}
				<div className="flex flex-wrap gap-1.5 mb-3">
					{schedule.days.map((day) => (
						<span
							key={day}
							className="px-2.5 py-1 text-sm rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
						>
							{day}
						</span>
					))}
					{schedule.excludesHolidays && (
						<span className="px-2.5 py-1 text-sm rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
							bez świąt
						</span>
					)}
				</div>

				{/* Holiday warning */}
				{showHolidayWarning && (
					<div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--md-sys-color-error-container)]">
						<WarningAmberIcon
							sx={{ fontSize: 20, color: "var(--md-sys-color-on-error-container)" }}
						/>
						<p className="md-body-medium text-[var(--md-sys-color-on-error-container)]">
							Prawdopodobnie nie kursuje dziś - {holidayInfo.name}
						</p>
					</div>
				)}

				{/* Operation note */}
				{line.operationNote && (
					<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] italic mt-2">
						{line.operationNote}
					</p>
				)}
			</div>

			{/* Route timeline */}
			<div className="md-card md-elevation-1 p-4 mb-4">
				<h2 className="md-title-medium mb-4">Trasa przejazdu</h2>

				<div className="relative">
					{stops.map((stop, index) => {
						const isFirst = index === 0;
						const isLast = index === stops.length - 1;
						const isHighlighted = fromStopId === stop.id;

						return (
							<div
								key={stop.id}
								className={`relative flex items-start gap-3 ${!isLast ? "pb-6" : ""}`}
							>
								{/* Timeline line */}
								{!isLast && (
									<div className="absolute left-[11px] top-6 w-0.5 h-[calc(100%-12px)] bg-[var(--md-sys-color-primary)]" />
								)}

								{/* Timeline dot */}
								<div className="relative z-10 flex-shrink-0">
									{isHighlighted ? (
										<div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-primary)] flex items-center justify-center">
											<PlaceIcon
												sx={{
													fontSize: 16,
													color: "var(--md-sys-color-on-primary)",
												}}
											/>
										</div>
									) : isFirst || isLast ? (
										<div className="w-6 h-6 rounded-full bg-[var(--md-sys-color-primary)] flex items-center justify-center">
											<FiberManualRecordIcon
												sx={{
													fontSize: 12,
													color: "var(--md-sys-color-on-primary)",
												}}
											/>
										</div>
									) : (
										<div className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-surface)]">
											<RadioButtonUncheckedIcon
												sx={{
													fontSize: 8,
													color: "var(--md-sys-color-primary)",
												}}
											/>
										</div>
									)}
								</div>

								{/* Stop info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between gap-2">
										<div className="min-w-0">
											<p
												className={`md-body-large truncate ${
													isHighlighted
														? "font-medium text-[var(--md-sys-color-primary)]"
														: ""
												}`}
											>
												{stop.city}
											</p>
											{stop.name && (
												<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] truncate">
													{stop.name}
												</p>
											)}
										</div>

										{/* Time */}
										<div
											className={`flex-shrink-0 px-3 py-1 rounded-lg ${
												isHighlighted
													? "bg-[var(--md-sys-color-primary-container)]"
													: "bg-[var(--md-sys-color-surface-variant)]"
											}`}
										>
											<span
												className={`md-title-medium ${
													isHighlighted
														? "text-[var(--md-sys-color-on-primary-container)]"
														: "text-[var(--md-sys-color-on-surface-variant)]"
												}`}
											>
												{stop.arrivalTime || "--:--"}
											</span>
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				{stops.length === 0 && (
					<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)] text-center py-4">
						Brak danych o przystankach
					</p>
				)}
			</div>

			{/* Actions footer */}
			<div className="md-card md-elevation-1 p-4 mb-6">
				<div className="flex items-center justify-between">
					{/* Score */}
					<div className="flex items-center gap-2">
						<span
							className={`md-title-medium ${
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
						<span className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
							punktów
						</span>
					</div>

					{/* Action buttons */}
					<div className="flex items-center gap-1">
						{/* Upvote */}
						<button
							onClick={() => handleVote("up")}
							disabled={voteLoading}
							className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors disabled:opacity-50"
							title="Aktualny"
						>
							{voteState === "up" ? (
								<ThumbUpIcon
									sx={{ fontSize: 22, color: "var(--md-sys-color-primary)" }}
								/>
							) : (
								<ThumbUpOutlinedIcon
									sx={{
										fontSize: 22,
										color: "var(--md-sys-color-on-surface-variant)",
									}}
								/>
							)}
						</button>

						{/* Downvote */}
						<button
							onClick={() => handleVote("down")}
							disabled={voteLoading}
							className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors disabled:opacity-50"
							title="Nieaktualny"
						>
							{voteState === "down" ? (
								<ThumbDownIcon
									sx={{ fontSize: 22, color: "var(--md-sys-color-error)" }}
								/>
							) : (
								<ThumbDownOutlinedIcon
									sx={{
										fontSize: 22,
										color: "var(--md-sys-color-on-surface-variant)",
									}}
								/>
							)}
						</button>

						{/* Report */}
						<button
							onClick={handleReport}
							className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
							title="Zgłoś problem"
						>
							<FlagOutlinedIcon
								sx={{
									fontSize: 22,
									color: "var(--md-sys-color-on-surface-variant)",
								}}
							/>
						</button>

						{/* Edit (placeholder) */}
						<button
							onClick={handleEdit}
							className="w-11 h-11 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
							title="Edytuj rozkład"
						>
							<EditOutlinedIcon
								sx={{
									fontSize: 22,
									color: "var(--md-sys-color-on-surface-variant)",
								}}
							/>
						</button>
					</div>
				</div>
			</div>
			{/* Report Modal */}
			<ReportModal
				isOpen={showReportModal}
				onClose={() => setShowReportModal(false)}
				scheduleId={scheduleId}
				scheduleName={schedule ? `${line?.carrierName} - ${schedule.direction}` : undefined}
				onSubmit={handleReportSubmit}
			/>
		</PageWrapper>
	);
}
