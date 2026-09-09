import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Property Collector - FlatNFlatmates Admin',
  description: 'Field Admin property collection and management portal for FlatNFlatmates',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased flex flex-col selection:bg-indigo-500 selection:text-white pb-20 md:pb-8">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6">{children}</main>
        <BottomNav />

        {/* Google Maps JS API with Places library */}
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}&libraries=places,geometry`}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
