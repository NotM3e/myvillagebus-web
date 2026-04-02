import BlockIcon from "@mui/icons-material/Block";

export default function BannedScreen() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-(--md-sys-color-background)">
			<div className="text-center px-6 max-w-md">
				<div className="w-20 h-20 rounded-full bg-(--md-sys-color-error-container) flex items-center justify-center mx-auto mb-6">
					<BlockIcon
						sx={{ fontSize: 40, color: "var(--md-sys-color-on-error-container)" }}
					/>
				</div>

				<h1 className="md-headline-medium mb-4">Konto zablokowane</h1>

				<p className="md-body-large text-(--md-sys-color-on-surface-variant) mb-8">
					Twoje konto zostało zablokowane z powodu naruszenia regulaminu. Jeśli uważasz,
					że to pomyłka, skontaktuj się z nami.
				</p>

				<a
					href="/contact"
					className="md-filled-tonal-button inline-flex items-center gap-2"
				>
					Skontaktuj się
				</a>
			</div>
		</div>
	);
}
