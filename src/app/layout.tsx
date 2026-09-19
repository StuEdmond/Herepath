import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import Script from "next/script";
import { Archivo, Archivo_Narrow } from "next/font/google";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieConsentBanner } from "@/components/layout/cookie-consent-banner";
import { NativeSystemBars } from "@/components/layout/native-system-bars";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const archivoNarrow = Archivo_Narrow({
  variable: "--font-archivo-narrow",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Herepath",
    template: "%s · Herepath",
  },
  description: "Ancient roads. Modern riders. A UK motorcycle route guide.",
};

// "cover" lets the page draw behind the phone's status bar, so the header colour fills it in either theme;
// the header and bottom bar pad themselves by the safe-area insets so nothing sits under the bars or a notch.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-GB"
      className={`${archivo.variable} ${archivoNarrow.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-bg text-text-primary">
        {/* Applies a saved Light/Dark choice before first paint, so pages don't flash the wrong theme. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("herepath:theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
          }}
        />
        <NativeSystemBars />
        <Header />
        <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>
        <Footer />
        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>
        <CookieConsentBanner />
      </body>
    </html>
  );
}
