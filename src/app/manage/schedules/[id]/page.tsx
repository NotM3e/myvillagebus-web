"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import VerifiedIcon from "@mui/icons-material/Verified";
import PlaceIcon from "@mui/icons-material/Place";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface ScheduleDetails {
	id: string;
	direction: string;
	version: number;
	status: string;
	days: string[];
	excludes_holidays: boolean;
	created_at: string;
	line: {
		number: string;
		carrier: {
			name: string;
			status: string;
		};
	};
	creator: {
		display_name: string | null;
	} | null;
}

interface StopWithTime {
	order_index: number;
	offset_minutes: number;
	stop: {
		id: string;
		city: string;
		name: string;
	};
	arrival_time: string | null;
}

interface PageProps {
	params: Promise<{ id: string }>;
}

export default function ManaScheduleDetailPage({ params }: PageProps) {
	const { id: scheduleId } = use(params);

	const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);
	const [stops, setStops] = useState<StopWithTime[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			const supabase = createClient();

			// Fetch schedule
			const { data: scheduleData, error: scheduleError } = await supabase
				.from("schedules")
				.select(
					`
          id,
          direction,
          version,
          status,
          days,
          excludes_holidays,
          created_at,
          line:lines (
            number,
            carrier:carriers (
              name,
              status
            )
          ),
          creator:profiles!created_by (
            display_name
          )
        `
				)
				.eq("id", scheduleId)
				.single();

			if (scheduleError || !scheduleData) {
				setError("Nie znaleziono rozkładu");
				setLoading(false);
				return;
			}

			// Normalize
			const lineData = Array.isArray(scheduleData.line)
				? scheduleData.line[0]
				: scheduleData.line;
			const carrierData = Array.isArray(lineData?.carrier)
				? lineData.carrier[0]
				: lineData?.carrier;

			const normalized: ScheduleDetails = {
				id: scheduleData.id,
				direction: scheduleData.direction,
				version: scheduleData.version,
				status: scheduleData.status,
				days: scheduleData.days,
				excludes_holidays: scheduleData.excludes_holidays,
				created_at: scheduleData.created_at,
				line: {
					number: lineData?.number || "",
					carrier: {
						name: carrierData?.name || "",
						status: carrierData?.status || "unverified",
					},
				},
				creator: Array.isArray(scheduleData.creator)
					? scheduleData.creator[0]
					: scheduleData.creator,
			};

			setSchedule(normalized);

			// Fetch route stops
			const { data: routeStops } = await supabase
				.from("route_stops")
				.select(
					`
          order_index,
          offset_minutes,
          stop:stops (
            id,
            city,
            name
          )
        `
				)
				.eq("schedule_id", scheduleId)
				.order("order_index");

			// Fetch course
			const { data: courses } = await supabase
				.from("courses")
				.select("id, departure_time, use_offsets")
				.eq("schedule_id", scheduleId)
				.limit(1);

			const course = courses?.[0];

			// Calculate times
			const stopsWithTimes: StopWithTime[] = (routeStops || []).map((rs: any) => {
				const stop = Array.isArray(rs.stop) ? rs.stop[0] : rs.stop;
				let arrivalTime: string | null = null;

				if (course) {
					if (course.use_offsets && course.departure_time) {
						const [hours, minutes] = course.departure_time.split(":").map(Number);
						const totalMinutes = hours * 60 + minutes + rs.offset_minutes;
						const newHours = Math.floor(totalMinutes / 60) % 24;
						const newMinutes = totalMinutes % 60;
						arrivalTime = `${newHours.toString().padStart(2, "0")}:${newMinutes.toString().padStart(2, "0")}`;
					}
				}

				return {
					order_index: rs.order_index,
					offset_minutes: rs.offset_minutes,
					stop,
					arrival_time: arrivalTime,
				};
			});

			setStops(stopsWithTimes);
			setLoading(false);
		};

		fetchData();
	}, [scheduleId]);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "var(--md-sys-color-primary)";
			case "pending":
				return "var(--md-sys-color-tertiary)";
			case "flagged":
				return "var(--md-sys-color-error)";
			default:
				return "var(--md-sys-color-outline)";
		}
	};

	if (loading) {
		return (
			<div>
				<div className="flex items-center gap-4 mb-6">
					<Link
						href="/manage/schedules"
						className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
					>
						<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
					</Link>
					<h1 className="md-title-large">Szczegóły rozkładu</h1>
				</div>
				<div className="flex items-center justify-center h-64">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin" />
				</div>
			</div>
		);
	}

	if (error || !schedule) {
		return (
			<div>
				<div className="flex items-center gap-4 mb-6">
					<Link
						href="/manage/schedules"
						className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
					>
						<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
					</Link>
					<h1 className="md-title-large">Szczegóły rozkładu</h1>
				</div>
				<div className="md-card md-elevation-1 p-8 text-center">
					<p className="md-body-large text-[var(--md-sys-color-error)]">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Header */}
			<div className="flex items-center gap-4 mb-6">
				<Link
					href="/manage/schedules"
					className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
				>
					<ArrowBackIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
				</Link>
				<h1 className="md-title-large">Szczegóły rozkładu</h1>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Info card */}
				<div
					className="md-card md-elevation-1 p-4 border-l-4"
					style={{ borderLeftColor: getStatusColor(schedule.status) }}
				>
					<div className="flex items-center gap-3 mb-4">
						<div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
							<DirectionsBusIcon
								sx={{
									fontSize: 28,
									color: "var(--md-sys-color-on-primary-container)",
								}}
							/>
						</div>
						<div>
							<div className="flex items-center gap-2">
								<p className="md-title-medium">{schedule.line.carrier.name}</p>
								{schedule.line.carrier.status !== "unverified" && (
									<VerifiedIcon
										sx={{ fontSize: 16, color: "var(--md-sys-color-primary)" }}
									/>
								)}
							</div>
							<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
								Linia {schedule.line.number}
							</p>
						</div>
					</div>

					<p className="md-title-large mb-4">{schedule.direction}</p>

					{/* Status */}
					<div className="flex items-center gap-2 mb-4">
						<span
							className="px-3 py-1 rounded-full text-sm"
							style={{
								backgroundColor: `${getStatusColor(schedule.status)}20`,
								color: getStatusColor(schedule.status),
							}}
						>
							{schedule.status}
						</span>
						<span className="px-3 py-1 rounded-full text-sm bg-[var(--md-sys-color-surface-variant)]">
							v{schedule.version}
						</span>
					</div>

					{/* Days */}
					<div className="flex flex-wrap gap-1 mb-4">
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

					{/* Creator */}
					<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
						Autor: {schedule.creator?.display_name || "Nieznany"}
					</p>
					<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
						Utworzono: {new Date(schedule.created_at).toLocaleString("pl-PL")}
					</p>
				</div>

				{/* Stops card */}
				<div className="md-card md-elevation-1 p-4">
					<h2 className="md-title-medium mb-4">Trasa przejazdu</h2>

					<div className="relative">
						{stops.map((stop, index) => {
							const isFirst = index === 0;
							const isLast = index === stops.length - 1;

							return (
								<div
									key={stop.stop.id}
									className={`relative flex items-start gap-3 ${!isLast ? "pb-4" : ""}`}
								>
									{/* Timeline line */}
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

									{/* Info */}
									<div className="flex-1 flex items-center justify-between gap-2">
										<div>
											<p className="md-body-medium">{stop.stop.city}</p>
											{stop.stop.name && (
												<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
													{stop.stop.name}
												</p>
											)}
										</div>
										<span className="px-3 py-1 rounded-lg bg-[var(--md-sys-color-surface-variant)] md-body-medium">
											{stop.arrival_time || `+${stop.offset_minutes}min`}
										</span>
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
			</div>
		</div>
	);
}
