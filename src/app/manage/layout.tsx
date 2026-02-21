"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";
import Link from "next/link";

import DashboardIcon from "@mui/icons-material/Dashboard";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import PeopleIcon from "@mui/icons-material/People";
import PlaceIcon from "@mui/icons-material/Place";
import HistoryIcon from "@mui/icons-material/History";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ScheduleIcon from "@mui/icons-material/Schedule";

const ALLOWED_ROLES: UserRole[] = ["admin", "super_editor"];

const NAV_ITEMS = [
	{ href: "/manage", label: "Dashboard", icon: DashboardIcon },
	{ href: "/manage/reports", label: "Zgłoszenia", icon: ReportProblemIcon },
	{ href: "/manage/schedules", label: "Rozkłady", icon: ScheduleIcon },
	{ href: "/manage/users", label: "Użytkownicy", icon: PeopleIcon },
	{ href: "/manage/data", label: "Słowniki", icon: PlaceIcon },
	{ href: "/manage/logs", label: "Logi", icon: HistoryIcon },
];

export default function ManaLayout({ children }: { children: React.ReactNode }) {
	const [authorized, setAuthorized] = useState<boolean | null>(null);
	const [currentPath, setCurrentPath] = useState("/manage");
	const router = useRouter();

	useEffect(() => {
		const checkAuth = async () => {
			const supabase = createClient();

			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (!session?.user) {
				router.replace("/app");
				return;
			}

			const { data: profile } = await supabase
				.from("profiles")
				.select("role")
				.eq("id", session.user.id)
				.single();

			if (!profile || !ALLOWED_ROLES.includes(profile.role as UserRole)) {
				router.replace("/app");
				return;
			}

			setAuthorized(true);
		};

		checkAuth();
	}, [router]);

	useEffect(() => {
		setCurrentPath(window.location.pathname);
	}, []);

	if (authorized === null) {
		return (
			<div className="min-h-screen bg-[var(--md-sys-color-background)] flex items-center justify-center">
				<div className="text-center">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
						Sprawdzanie uprawnień...
					</p>
				</div>
			</div>
		);
	}

	if (!authorized) {
		return null;
	}

	return (
		<div className="min-h-screen bg-[var(--md-sys-color-background)] flex">
			{/* Sidebar */}
			<aside className="w-64 bg-[var(--md-sys-color-surface)] border-r border-[var(--md-sys-color-outline-variant)] flex flex-col">
				{/* Header */}
				<div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]">
					<h1 className="md-title-large text-[var(--md-sys-color-primary)]">
						Panel Zarządzania
					</h1>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-2">
					{NAV_ITEMS.map((item) => {
						const Icon = item.icon;
						const isActive = currentPath === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								onClick={() => setCurrentPath(item.href)}
								className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
									isActive
										? "bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)]"
										: "hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface)]"
								}`}
							>
								<Icon sx={{ fontSize: 20 }} />
								<span className="md-body-medium">{item.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* Footer */}
				<div className="p-2 border-t border-[var(--md-sys-color-outline-variant)]">
					<Link
						href="/app"
						className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--md-sys-color-surface-variant)] text-[var(--md-sys-color-on-surface-variant)] transition-colors"
					>
						<ArrowBackIcon sx={{ fontSize: 20 }} />
						<span className="md-body-medium">Wróć do aplikacji</span>
					</Link>
				</div>
			</aside>

			{/* Main content */}
			<main className="flex-1 p-6 overflow-auto">{children}</main>
		</div>
	);
}
