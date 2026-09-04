import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Toaster } from "react-hot-toast";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Hometown Hub – Digital Community Platform",
  description: "Reconnect with the people, places, events, and stories that make your hometown special.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="font-body">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-64px)] max-w-6xl px-4 py-6">{children}</main>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
