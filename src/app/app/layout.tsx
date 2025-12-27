import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aplikacja Web - Wsiobus | Rozkłady autobusów online",
  description: "Aplikacja webowa Wsiobus - przeglądaj rozkłady autobusów w przeglądarce. Wersja PWA dla iOS i Android. Już wkrótce pełna funkcjonalność!",
  openGraph: {
    title: "Aplikacja Web - Wsiobus",
    description: "Rozkłady autobusów w przeglądarce. PWA dla wszystkich urządzeń.",
    url: "https://wsiobus.pl/app",
    siteName: "Wsiobus",
    locale: "pl_PL",
    type: "website",
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}