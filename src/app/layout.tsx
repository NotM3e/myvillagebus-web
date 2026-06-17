import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Wsiobus - Rozkłady autobusów",
	description: "Rozkłady autobusowe tworzone przez użytkowników, dla użytkowników",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// JSON-LD dla SEO
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "MobileApplication",
		name: "Wsiobus",
		applicationCategory: "TravelApplication",
		operatingSystem: "Android, iOS (PWA)",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "PLN",
		},
		description:
			"Rozkłady lokalnych przewoźników autobusowych. Aplikacja offline, tworzona przez społeczność.",
		url: "https://wsiobus.pl",
		author: {
			"@type": "Organization",
			name: "myVillageBus",
		},
	};

	return (
		<html lang="pl_PL">
			<head>
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap"
					rel="stylesheet"
				/>
				<link rel="icon" href="/icons/icon-32x32.png" sizes="any" />
				<link rel="manifest" href="/manifest.json" />
				<meta name="theme-color" content="#6750A4" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Wsiobus" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
				/>
			</head>
			<body>{children}</body>
		</html>
	);
}
