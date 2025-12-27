import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt - Wsiobus | Pytania o aplikację rozkładów",
  description: "Masz pytania o Wsiobus? Napisz do nas! Pomoc techniczna, sugestie funkcji, współpraca z przewoźnikami.",
  openGraph: {
    title: "Kontakt - Wsiobus",
    description: "Skontaktuj się z nami w sprawie aplikacji Wsiobus.",
    url: "https://wsiobus.pl/contact",
    siteName: "Wsiobus",
    locale: "pl_PL",
    type: "website",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}