"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const ALLOWED_ROLES: UserRole[] = ["admin", "super_editor"];

const NAV_ITEMS = [
	{ href: "/manage", label: "Przegląd", icon: DashboardIcon },
	{ href: "/manage/reports", label: "Moderacja", icon: ReportProblemIcon },
	{ href: "/manage/schedules", label: "Rozkłady", icon: ScheduleIcon },
	{ href: "/manage/users", label: "Społeczność", icon: PeopleIcon },
	{ href: "/manage/data", label: "Dane bazowe", icon: PlaceIcon },
	{ href: "/manage/logs", label: "Dziennik zdarzeń", icon: HistoryIcon },
];

export default function ManaLayout({ children }: { children: React.ReactNode }) {
	const [authorized, setAuthorized] = useState<boolean | null>(null);
	const [currentPath, setCurrentPath] = useState("/manage");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const router = useRouter();
	const pathname = usePathname();

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
		setCurrentPath(pathname || "/manage");
	}, [pathname]);

	// Automatyczne zamykanie menu na mobile po zmianie ścieżki
	useEffect(() => {
		setSidebarOpen(false);
	}, [pathname]);

	if (authorized === null) {
		return (
			<div className="min-h-screen bg-(--md-sys-color-background) flex items-center justify-center">
				<div className="text-center">
					<div className="w-8 h-8 border-2 border-(--md-sys-color-primary) border-t-transparent rounded-full animate-spin mx-auto mb-4" />
					<p className="md-body-medium text-(--md-sys-color-on-surface-variant)">
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
		<div className="h-[100dvh] bg-(--md-sys-color-background) flex overflow-hidden">
			{/* Mobile Backdrop */}
			{sidebarOpen && (
				<div 
					className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
					onClick={() => setSidebarOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<aside 
				className={`fixed md:relative inset-y-0 left-0 z-50 w-64 h-full bg-(--md-sys-color-surface) border-r border-(--md-sys-color-outline-variant) flex flex-col shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${
					sidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{/* Header */}
				<div className="p-4 border-b border-(--md-sys-color-outline-variant) flex items-center justify-between">
					<h1 className="md-title-large text-(--md-sys-color-primary)">
						Panel Zarządzania
					</h1>
					<button 
						className="md:hidden p-1 rounded-full hover:bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface-variant)"
						onClick={() => setSidebarOpen(false)}
					>
						<CloseIcon sx={{ fontSize: 24 }} />
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex-1 p-2 overflow-y-auto">
					{NAV_ITEMS.map((item) => {
						const Icon = item.icon;
						const isActive = currentPath === item.href;

						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-3 px-4 py-3 rounded-xl mb-1 transition-colors ${
									isActive
										? "bg-(--md-sys-color-primary-container) text-(--md-sys-color-on-primary-container)"
										: "hover:bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface)"
								}`}
							>
								<Icon sx={{ fontSize: 20 }} />
								<span className="md-body-medium">{item.label}</span>
							</Link>
						);
					})}
				</nav>

				{/* Footer */}
				<div className="p-2 border-t border-(--md-sys-color-outline-variant)">
					<Link
						href="/app"
						className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface-variant) transition-colors"
					>
						<ArrowBackIcon sx={{ fontSize: 20 }} />
						<span className="md-body-medium">Wróć do aplikacji</span>
					</Link>
				</div>
			</aside>

			{/* Main content + Mobile Header */}
			<div className="flex-1 flex flex-col min-w-0">
				{/* Mobile Header (visible only on small screens) */}
				<header className="md:hidden flex items-center p-4 border-b border-(--md-sys-color-outline-variant) bg-(--md-sys-color-surface) shrink-0">
					<button 
						className="p-1 -ml-1 mr-3 rounded-full hover:bg-(--md-sys-color-surface-variant) text-(--md-sys-color-on-surface)"
						onClick={() => setSidebarOpen(true)}
					>
						<MenuIcon sx={{ fontSize: 24 }} />
					</button>
					<h2 className="md-title-medium text-(--md-sys-color-on-surface) truncate">
						{NAV_ITEMS.find(i => i.href === currentPath)?.label || "Panel Zarządzania"}
					</h2>
				</header>

				{/* Page Content */}
				<main className="flex-1 p-4 md:p-6 overflow-y-auto">
					{children}
				</main>
			</div>
		</div>
	);
}
