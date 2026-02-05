import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline - Wsiobus",
  description: "Brak połączenia z internetem",
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}