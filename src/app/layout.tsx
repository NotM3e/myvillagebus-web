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
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" 
          rel="stylesheet" 
        />
        <link rel="icon" href="icons/icon-32x32.png" sizes="any" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}