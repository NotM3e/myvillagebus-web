import type { Metadata, Viewport } from "next";
import "./globals.css";

// Metadata
export const metadata: Metadata = {
  title: "Mój Wsiobus - Rozkłady Autobusów",
  description: "Rozkłady autobusów zawsze pod ręką dla nie wielkich przewoźników",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mój Wsiobus",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
};

// Viewport - PRZENIESIONE z metadata
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#121212",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl-PL">
      <head>
        {/* Meta tags dla PWA */}
        <meta name="application-name" content="Mój Wsiobus" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mój Wsiobus" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Google Fonts - Roboto */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* Material Symbols */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" 
          rel="stylesheet" 
        />
        
        {/* Umami Analytics - TODO */}
        {/* <script async src="https://analytics.umami.is/script.js" data-website-id="YOUR-ID"></script> TODO*/}
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}