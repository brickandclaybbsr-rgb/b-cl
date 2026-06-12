import type { Metadata, Viewport } from "next";
import { Poppins, Montserrat } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { NativeBootstrap } from "@/components/native-bootstrap";
import "./globals.css";

// Body / UI — clean geometric sans
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});
// Display / headings — bold geometric, echoes the wordmark (Gotham-like)
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "B&C Ops — Brick & Clay",
    template: "%s · B&C Ops",
  },
  description: "Brick & Clay Operations Platform",
  manifest: "/manifest.json",
  applicationName: "B&C Ops",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "B&C Ops",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${montserrat.variable}`}
      suppressHydrationWarning
    >
      <body>
        {children}
        <Toaster />
        <NativeBootstrap />
      </body>
    </html>
  );
}
