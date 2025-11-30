import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProfileProvider } from "@/components/context/UserProfileContext";
import { Analytics } from "@vercel/analytics/next"
import Script from "next/script";
import ThemeInitializer from "@/components/theme/ThemeInitializer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {  title: "DocsComliance",  description: "Created by DocsComliance(Oleksandr B. and Dzmitry D.)",};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.brevo.com/js/sdk-loader.js"
          strategy="afterInteractive"
          async
        />
        <Script
          id="brevo-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.Brevo = window.Brevo || [];
              Brevo.push([
                "init",
                {
                  client_key: "${process.env.NEXT_PUBLIC_BREVO_CLIENT_KEY}",
                }
              ]);
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <ThemeInitializer />
        <Analytics />
        <UserProfileProvider>
          {children}
        </UserProfileProvider>
      </body>
    </html>
  );
}
