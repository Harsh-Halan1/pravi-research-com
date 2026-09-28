import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/i18n/locale-switcher";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pravi | Public Asset Registry",
  description: "A lifecycle workspace for public infrastructure assets.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <ClerkProvider>
      <html lang={locale}>
        <body>
          <NextIntlClientProvider>
            {children}
            <LocaleSwitcher />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
