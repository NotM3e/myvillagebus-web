import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ustawienia - Wsiobus",
  description: "Ustawienia aplikacji Wsiobus",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}