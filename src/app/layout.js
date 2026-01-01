import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SocketInit from "@/components/SocketInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Paint and Chat",
  description: "A cozy real-time collaborative drawing and chatting app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SocketInit />
        {children}
      </body>
    </html>
  );
}
