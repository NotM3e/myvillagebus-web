"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useSavedFilters, useDownloadedLines } from "@/lib/db/hooks";

import CloseIcon from "@mui/icons-material/Close";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import RouteIcon from "@mui/icons-material/Route";
import DirectionsBusIcon from "@mui/icons-material/DirectionsBus";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";

interface AppDrawerProps {
	isOpen: boolean;
	onClose: () => void;
}

export default function AppDrawer({ isOpen, onClose }: AppDrawerProps) {
	const [user, setUser] = useState<User | null>(null);
	const { filters, refresh: refreshFilters } = useSavedFilters();
	const { lines, refresh: refreshLines } = useDownloadedLines();

	// Listen for updates
	useEffect(() => {
		const handleFiltersUpdate = () => refreshFilters();
		const handleLinesUpdate = () => refreshLines();

		window.addEventListener("filters-updated", handleFiltersUpdate);
		window.addEventListener("lines-updated", handleLinesUpdate);

		return () => {
			window.removeEventListener("filters-updated", handleFiltersUpdate);
			window.removeEventListener("lines-updated", handleLinesUpdate);
		};
	}, [refreshFilters, refreshLines]);

	useEffect(() => {
		const supabase = createClient();

		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

	const handleLogin = async () => {
		const supabase = createClient();
		const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
		await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				redirectTo: `${appUrl}/auth/callback`,
			},
		});
	};

	const handleLogout = async () => {
		const supabase = createClient();
		await supabase.auth.signOut();
		onClose();
	};

	// Zamknij drawer po kliknięciu linku
	const handleLinkClick = () => {
		onClose();
	};

	return (
		<>
			{/* Backdrop */}
			<div
				className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
					isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
				onClick={onClose}
			/>

			{/* Drawer */}
			<aside
				className={`fixed top-0 left-0 z-50 h-full w-80 max-w-[85vw] bg-[var(--md-sys-color-surface)] shadow-xl transform transition-transform duration-300 ease-out ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="flex items-center justify-between p-4 border-b border-[var(--md-sys-color-outline-variant)]">
						<span className="md-title-large text-[var(--md-sys-color-primary)]">
							WSIOBUS
						</span>
						<button
							onClick={onClose}
							className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
							aria-label="Zamknij menu"
						>
							<CloseIcon sx={{ color: "var(--md-sys-color-on-surface)" }} />
						</button>
					</div>

					{/* Scrollable content */}
					<div className="flex-1 overflow-y-auto">
						{/* User section */}
						<div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]">
							{user ? (
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center overflow-hidden">
										{user.user_metadata?.avatar_url ? (
											<img
												src={user.user_metadata.avatar_url}
												alt="Avatar"
												className="w-12 h-12 rounded-full"
											/>
										) : (
											<PersonOutlineIcon
												sx={{
													fontSize: 28,
													color: "var(--md-sys-color-on-primary-container)",
												}}
											/>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="md-title-medium truncate">
											{user.user_metadata?.full_name ??
												user.email?.split("@")[0]}
										</p>
										<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
											Viewer • 0 pkt
										</p>
									</div>
								</div>
							) : (
								<button
									onClick={handleLogin}
									className="w-full md-filled-button flex items-center justify-center gap-2"
								>
									<LoginIcon sx={{ fontSize: 20 }} />
									Zaloguj przez Google
								</button>
							)}
						</div>

						{/* Saved filters section */}
						<div className="p-4 border-b border-[var(--md-sys-color-outline-variant)]">
							<p className="md-label-large text-[var(--md-sys-color-on-surface-variant)] mb-3">
								Twoje trasy
							</p>
							{filters.length === 0 ? (
								<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
									Brak zapisanych tras. Użyj przycisku + aby zapisać filtr.
								</p>
							) : (
								<div className="space-y-1">
									{filters.map((filter) => (
										<Link
											key={filter.id}
											href={`/app?filterId=${filter.id}`}
											onClick={handleLinkClick}
											className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-left"
										>
											<RouteIcon
												sx={{
													fontSize: 20,
													color: "var(--md-sys-color-primary)",
												}}
											/>
											<div className="flex-1 min-w-0">
												<span className="md-body-medium truncate block">
													{filter.name}
												</span>
												{(filter.fromStop || filter.toStop) && (
													<span className="md-body-small text-[var(--md-sys-color-on-surface-variant)] truncate block">
														{filter.fromStop?.city ?? "?"} →{" "}
														{filter.toStop?.city ?? "?"}
													</span>
												)}
											</div>
										</Link>
									))}
								</div>
							)}
						</div>

						{/* Tools section */}
						<div className="p-4">
							<p className="md-label-large text-[var(--md-sys-color-on-surface-variant)] mb-3">
								Narzędzia
							</p>
							<nav className="space-y-1">
								<Link
									href="/app/browse"
									onClick={handleLinkClick}
									className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
								>
									<DirectionsBusIcon
										sx={{
											fontSize: 24,
											color: "var(--md-sys-color-on-surface-variant)",
										}}
									/>
									<div>
										<p className="md-body-large">Zarządzaj liniami</p>
										<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
											Pobrane: {lines.length}
										</p>
									</div>
								</Link>

								<Link
									href="/app/create"
									onClick={handleLinkClick}
									className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-left"
								>
									<AddCircleOutlineIcon
										sx={{
											fontSize: 24,
											color: "var(--md-sys-color-on-surface-variant)",
										}}
									/>
									<div>
										<p className="md-body-large">Dodaj rozkład</p>
										<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
											Utwórz nowy rozkład
										</p>
									</div>
								</Link>

								<Link
									href="/app/settings"
									onClick={handleLinkClick}
									className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
								>
									<SettingsOutlinedIcon
										sx={{
											fontSize: 24,
											color: "var(--md-sys-color-on-surface-variant)",
										}}
									/>
									<p className="md-body-large">Ustawienia</p>
								</Link>
							</nav>
						</div>
					</div>

					{/* Footer - logout */}
					{user && (
						<div className="p-4 border-t border-[var(--md-sys-color-outline-variant)]">
							<button
								onClick={handleLogout}
								className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg hover:bg-[var(--md-sys-color-surface-variant)] transition-colors text-[var(--md-sys-color-error)]"
							>
								<LogoutIcon sx={{ fontSize: 20 }} />
								<span className="md-body-medium">Wyloguj</span>
							</button>
						</div>
					)}
				</div>
			</aside>
		</>
	);
}
