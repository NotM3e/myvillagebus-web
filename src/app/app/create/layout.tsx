import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dodaj rozkład - Wsiobus",
  description: "Dodaj nowy rozkład autobusu do bazy Wsiobus",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}