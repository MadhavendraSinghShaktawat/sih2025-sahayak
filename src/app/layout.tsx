import type { Metadata } from "next";
import { IBM_Plex_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/context/i18n-provider";
import { ServiceWorkerProvider } from "@/components/ServiceWorkerProvider";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sahayak",
  description:
    "Sahayak is a digital learning platform for rural school students in Nabha",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} antialiased`}>
        <ServiceWorkerProvider>
          <I18nProvider>{children}</I18nProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
