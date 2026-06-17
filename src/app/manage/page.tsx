"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PeopleIcon from "@mui/icons-material/People";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import PlaceIcon from "@mui/icons-material/Place";
import ScheduleIcon from "@mui/icons-material/Schedule";

interface DashboardStats {
	pendingReports: number;
	pendingSchedules: number;
	totalUsers: number;
	totalSchedules: number;
	totalStops: number;
}

export default function ManaDashboard() {
	const [stats, setStats] = useState<DashboardStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchStats = async () => {
			const supabase = createClient();

			const [reportsRes, usersRes, schedulesRes, pendingSchedulesRes, stopsRes] =
				await Promise.all([
					supabase
						.from("reports")
						.select("id", { count: "exact" })
						.eq("status", "pending"),
					supabase.from("profiles").select("id", { count: "exact" }),
					supabase.from("schedules").select("id", { count: "exact" }),
					supabase
						.from("schedules")
						.select("id", { count: "exact" })
						.eq("status", "pending"),
					supabase.from("stops").select("id", { count: "exact" }),
				]);

			setStats({
				pendingReports: reportsRes.count ?? 0,
				pendingSchedules: pendingSchedulesRes.count ?? 0,
				totalUsers: usersRes.count ?? 0,
				totalSchedules: schedulesRes.count ?? 0,
				totalStops: stopsRes.count ?? 0,
			});
			setLoading(false);
		};

		fetchStats();
	}, []);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="w-8 h-8 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin" />
			</div>
		);
	}

	const statCards = [
		{
			label: "Oczekujące zgłoszenia",
			value: stats?.pendingReports ?? 0,
			icon: ReportProblemIcon,
			color: stats?.pendingReports
				? "var(--md-sys-color-error)]"
				: "var(--md-sys-color-primary)]",
			href: "/manage/reports",
		},
		{
			label: "Oczekujące rozkłady",
			value: stats?.pendingSchedules ?? 0,
			icon: ScheduleIcon,
			color: stats?.pendingSchedules
				? "var(--md-sys-color-tertiary)]"
				: "var(--md-sys-color-primary)]",
			href: "/manage/schedules",
		},
		{
			label: "Użytkownicy",
			value: stats?.totalUsers ?? 0,
			icon: PeopleIcon,
			color: "var(--md-sys-color-secondary)]",
			href: "/manage/users",
		},
		{
			label: "Rozkłady",
			value: stats?.totalSchedules ?? 0,
			icon: DirectionsBusIcon,
			color: "var(--md-sys-color-tertiary)]",
			href: null,
		},
		{
			label: "Przystanki",
			value: stats?.totalStops ?? 0,
			icon: PlaceIcon,
			color: "var(--md-sys-color-primary)]",
			href: "/manage/data",
		},
	];

	return (
		<div>
			<h1 className="md-headline-medium mb-6">Dashboard</h1>

			{/* Stats Grid */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				{statCards.map((card) => {
					const Icon = card.icon;

					return (
						<div
							key={card.label}
							className="md-card md-elevation-1 p-4 flex items-center gap-4"
						>
							<div
								className="w-12 h-12 rounded-full flex items-center justify-center"
								style={{ backgroundColor: `${card.color}20` }}
							>
								<Icon sx={{ fontSize: 24, color: card.color }} />
							</div>
							<div>
								<p className="md-headline-small" style={{ color: card.color }}>
									{card.value}
								</p>
								<p className="md-body-small text-(--md-sys-color-on-surface-variant)">
									{card.label}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			{/* Quick Actions */}
			<h2 className="md-title-large mb-4">Szybkie akcje</h2>
			<div className="md-card md-elevation-1 p-4">
				<p className="md-body-medium text-(--md-sys-color-on-surface-variant)">
					Wybierz moduł z menu po lewej stronie.
				</p>
			</div>
		</div>
	);
}
