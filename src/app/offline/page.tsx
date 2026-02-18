"use client";

import PageWrapper from "@/components/PageWrapper";
import Link from "next/link";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import RefreshIcon from "@mui/icons-material/Refresh";

export default function OfflinePage() {
	return (
		<PageWrapper maxWidth="max-w-md" className="flex items-center justify-center">
			<div className="text-center">
				{/* Icon */}
				<div className="w-24 h-24 rounded-full bg-[var(--md-sys-color-error-container)] flex items-center justify-center mx-auto mb-6">
					<WifiOffIcon
						sx={{ fontSize: 48, color: "var(--md-sys-color-on-error-container)" }}
					/>
				</div>

				{/* Title */}
				<h1 className="md-headline-medium mb-4">Brak połączenia</h1>

				{/* Description */}
				<p className="md-body-large text-[var(--md-sys-color-on-surface-variant)] mb-8">
					Nie możemy załadować tej strony. Sprawdź połączenie z internetem.
				</p>

				{/* Info about offline mode */}
				<div className="md-card md-elevation-1 p-4 mb-8 text-left">
					<p className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
						💡 <strong>Wskazówka:</strong> Pobrane linie są dostępne offline. Wróć do
						strony głównej aplikacji, aby przeglądać zapisane rozkłady.
					</p>
				</div>

				{/* Actions */}
				<div className="flex flex-col gap-3">
					<button
						onClick={() => window.location.reload()}
						className="md-filled-button inline-flex items-center justify-center gap-2 w-full"
					>
						<RefreshIcon />
						Spróbuj ponownie
					</button>

					<Link
						href="/app"
						className="md-outlined-button inline-flex items-center justify-center gap-2 w-full"
					>
						Przejdź do rozkładów
					</Link>
				</div>
			</div>
		</PageWrapper>
	);
}
