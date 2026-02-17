"use client";

import { useState } from "react";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import { useSettings, useDownloadedLines, useSavedFilters } from "@/lib/db/hooks";
import { db } from "@/lib/db";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import StorageIcon from "@mui/icons-material/Storage";
import WifiIcon from "@mui/icons-material/Wifi";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import IosShareIcon from "@mui/icons-material/IosShare";

export default function SettingsPage() {
	const { settings, loading: settingsLoading, updateSettings } = useSettings();
	const { lines, refresh: refreshLines } = useDownloadedLines();
	const { filters, refresh: refreshFilters } = useSavedFilters();

	const [clearing, setClearing] = useState<"lines" | "filters" | null>(null);
	const [showConfirm, setShowConfirm] = useState<"lines" | "filters" | null>(null);

	const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
	const [showIOSInstructions, setShowIOSInstructions] = useState(false);

	const handleClearLines = async () => {
		setClearing("lines");
		await db.lines.clear();
		await db.schedules.clear();
		await db.routeStops.clear();
		await db.courses.clear();
		await db.courseTimes.clear();
		await db.stops.clear();
		await db.syncMeta.clear();
		await refreshLines();
		window.dispatchEvent(new Event("lines-updated"));
		setClearing(null);
		setShowConfirm(null);
	};

	const handleClearFilters = async () => {
		setClearing("filters");
		await db.savedFilters.clear();
		await refreshFilters();
		window.dispatchEvent(new Event("filters-updated"));
		setClearing(null);
		setShowConfirm(null);
	};

	if (settingsLoading) {
		return (
			<PageWrapper maxWidth="max-w-2xl">
				<div className="text-center py-12">
					<div className="w-8 h-8 border-2 border-[var(--md-sys-color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
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
				<h1 className="md-title-large">Ustawienia</h1>
			</div>

			<div className="space-y-6">
				{/* Section: Data Management */}
				<section>
					<h2 className="md-title-medium text-[var(--md-sys-color-primary)] mb-3 flex items-center gap-2">
						<StorageIcon sx={{ fontSize: 20 }} />
						Dane lokalne
					</h2>

					<div className="md-card md-elevation-1 divide-y divide-[var(--md-sys-color-outline-variant)]">
						{/* Downloaded lines */}
						<div className="p-4 flex items-center justify-between">
							<div>
								<p className="md-body-large">Pobrane linie</p>
								<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
									{lines.length}{" "}
									{lines.length === 1 ? "linia" : lines.length < 5 ? "linie" : "linii"}
								</p>
							</div>
							{showConfirm === "lines" ? (
								<div className="flex gap-2">
									<button onClick={() => setShowConfirm(null)} className="md-text-button text-sm">
										Anuluj
									</button>
									<button
										onClick={handleClearLines}
										disabled={clearing === "lines"}
										className="md-filled-button bg-[var(--md-sys-color-error)] text-sm flex items-center gap-1"
									>
										{clearing === "lines" ? (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										) : (
											<DeleteOutlineIcon sx={{ fontSize: 16 }} />
										)}
										Usun
									</button>
								</div>
							) : (
								<button
									onClick={() => setShowConfirm("lines")}
									disabled={lines.length === 0}
									className="md-outlined-button text-sm flex items-center gap-1 disabled:opacity-50"
								>
									<DeleteOutlineIcon sx={{ fontSize: 16 }} />
									Wyczysc
								</button>
							)}
						</div>

						{/* Saved filters */}
						<div className="p-4 flex items-center justify-between">
							<div>
								<p className="md-body-large">Zapisane filtry</p>
								<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
									{filters.length}{" "}
									{filters.length === 1 ? "filtr" : filters.length < 5 ? "filtry" : "filtrow"}
								</p>
							</div>
							{showConfirm === "filters" ? (
								<div className="flex gap-2">
									<button onClick={() => setShowConfirm(null)} className="md-text-button text-sm">
										Anuluj
									</button>
									<button
										onClick={handleClearFilters}
										disabled={clearing === "filters"}
										className="md-filled-button bg-[var(--md-sys-color-error)] text-sm flex items-center gap-1"
									>
										{clearing === "filters" ? (
											<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										) : (
											<DeleteOutlineIcon sx={{ fontSize: 16 }} />
										)}
										Usun
									</button>
								</div>
							) : (
								<button
									onClick={() => setShowConfirm("filters")}
									disabled={filters.length === 0}
									className="md-outlined-button text-sm flex items-center gap-1 disabled:opacity-50"
								>
									<DeleteOutlineIcon sx={{ fontSize: 16 }} />
									Wyczysc
								</button>
							)}
						</div>
					</div>
				</section>

				{/* Section: Display */}
				<section>
					<h2 className="md-title-medium text-[var(--md-sys-color-primary)] mb-3 flex items-center gap-2">
						<VisibilityIcon sx={{ fontSize: 20 }} />
						Wyswietlanie
					</h2>

					<div className="md-card md-elevation-1 divide-y divide-[var(--md-sys-color-outline-variant)]">
						{/* Show pending */}
						<button
							onClick={() => updateSettings({ showPending: !settings?.showPending })}
							className="w-full p-4 flex items-center justify-between text-left"
						>
							<div className="flex items-center gap-3">
								<PendingActionsIcon
									sx={{ fontSize: 24, color: "var(--md-sys-color-on-surface-variant)" }}
								/>
								<div>
									<p className="md-body-large">Pokazuj oczekujace</p>
									<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
										Rozklady przed weryfikacja
									</p>
								</div>
							</div>
							<div
								className={`w-12 h-7 rounded-full transition-colors relative ${
									settings?.showPending
										? "bg-[var(--md-sys-color-primary)]"
										: "bg-[var(--md-sys-color-outline)]"
								}`}
							>
								<div
									className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
										settings?.showPending ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</div>
						</button>
					</div>
				</section>

				{/* Section: Network */}
				<section>
					<h2 className="md-title-medium text-[var(--md-sys-color-primary)] mb-3 flex items-center gap-2">
						<WifiIcon sx={{ fontSize: 20 }} />
						Siec
					</h2>

					<div className="md-card md-elevation-1 divide-y divide-[var(--md-sys-color-outline-variant)]">
						{/* Sync only WiFi */}
						<button
							onClick={() => updateSettings({ syncOnlyWifi: !settings?.syncOnlyWifi })}
							className="w-full p-4 flex items-center justify-between text-left"
						>
							<div>
								<p className="md-body-large">Tylko przez Wi-Fi</p>
								<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
									Synchronizuj dane tylko przez Wi-Fi
								</p>
							</div>
							<div
								className={`w-12 h-7 rounded-full transition-colors relative ${
									settings?.syncOnlyWifi
										? "bg-[var(--md-sys-color-primary)]"
										: "bg-[var(--md-sys-color-outline)]"
								}`}
							>
								<div
									className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
										settings?.syncOnlyWifi ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</div>
						</button>
					</div>
				</section>

				{/* Section: Install */}
				<section>
					<h2 className="md-title-medium text-[var(--md-sys-color-primary)] mb-3 flex items-center gap-2">
						<InstallMobileIcon sx={{ fontSize: 20 }} />
						Instalacja
					</h2>

					<div className="md-card md-elevation-1 divide-y divide-[var(--md-sys-color-outline-variant)]">
						{isInstalled ? (
							<div className="p-4 flex items-center gap-3">
								<CheckCircleIcon sx={{ fontSize: 24, color: "var(--md-sys-color-primary)" }} />
								<div>
									<p className="md-body-large">Aplikacja zainstalowana</p>
									<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
										Wsiobus jest na Twoim ekranie glownym
									</p>
								</div>
							</div>
						) : canInstall ? (
							<button
								onClick={promptInstall}
								className="w-full p-4 flex items-center justify-between text-left"
							>
								<div>
									<p className="md-body-large">Zainstaluj aplikacje</p>
									<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
										Dodaj Wsiobus do ekranu glownego
									</p>
								</div>
								<InstallMobileIcon sx={{ fontSize: 24, color: "var(--md-sys-color-primary)" }} />
							</button>
						) : isIOS ? (
							<>
								<button
									onClick={() => setShowIOSInstructions(!showIOSInstructions)}
									className="w-full p-4 flex items-center justify-between text-left"
								>
									<div>
										<p className="md-body-large">Zainstaluj aplikacje</p>
										<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
											Instrukcja dla iOS
										</p>
									</div>
									<IosShareIcon sx={{ fontSize: 24, color: "var(--md-sys-color-primary)" }} />
								</button>

								{showIOSInstructions && (
									<div className="p-4 bg-[var(--md-sys-color-surface-variant)]">
										<p className="md-body-medium mb-3">Jak zainstalowac na iOS:</p>
										<ol className="space-y-2 md-body-small text-[var(--md-sys-color-on-surface-variant)]">
											<li className="flex gap-2">
												<span>1.</span>
												<span>
													Kliknij ikone <strong>Udostepnij</strong> (kwadrat ze strzalka) na dole
													ekranu
												</span>
											</li>
											<li className="flex gap-2">
												<span>2.</span>
												<span>
													Przewin w dol i wybierz <strong>Dodaj do ekranu poczatkowego</strong>
												</span>
											</li>
											<li className="flex gap-2">
												<span>3.</span>
												<span>
													Kliknij <strong>Dodaj</strong> w prawym gornym rogu
												</span>
											</li>
										</ol>
									</div>
								)}
							</>
						) : (
							<div className="p-4">
								<p className="md-body-large mb-2">Zainstaluj aplikacje</p>
								<p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
									Uzyj menu przegladarki (trzy kropki) i wybierz "Zainstaluj aplikacje" lub "Dodaj
									do ekranu glownego".
								</p>
							</div>
						)}
					</div>
				</section>

				{/* Section: Info */}
				<section>
					<h2 className="md-title-medium text-[var(--md-sys-color-primary)] mb-3 flex items-center gap-2">
						<InfoOutlinedIcon sx={{ fontSize: 20 }} />
						Informacje
					</h2>

					<div className="md-card md-elevation-1 divide-y divide-[var(--md-sys-color-outline-variant)]">
						<a
							href="https://wsiobus.pl"
							target="_blank"
							rel="noopener noreferrer"
							className="p-4 flex items-center justify-between"
						>
							<p className="md-body-large">Strona projektu</p>
							<OpenInNewIcon
								sx={{ fontSize: 20, color: "var(--md-sys-color-on-surface-variant)" }}
							/>
						</a>

						<a
							href="https://wsiobus.pl/contact"
							target="_blank"
							rel="noopener noreferrer"
							className="p-4 flex items-center justify-between"
						>
							<p className="md-body-large">Kontakt</p>
							<OpenInNewIcon
								sx={{ fontSize: 20, color: "var(--md-sys-color-on-surface-variant)" }}
							/>
						</a>

						<div className="p-4 flex items-center justify-between">
							<p className="md-body-large">Wersja aplikacji</p>
							<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
								0.1.0 BETA
							</p>
						</div>
					</div>
				</section>
			</div>
		</PageWrapper>
	);
}
