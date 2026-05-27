import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Galla's Pizza & Tavern — Operations Dashboard",
  description: "Daily operations dashboard for Galla's Pizza & Tavern",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gallas-dark min-h-screen">{children}</body>
    </html>
  );
}
