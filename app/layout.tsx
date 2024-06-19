import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const space = Space_Grotesk({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Free QR Code Generator",
  description: "Generate QR codes for free with no ads or tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={
          space.className +
          "w-full mx-auto bg-teal-800 max-w-6xl antialiased select-none "
        }
      >
        {children}

        <Toaster />
      </body>
    </html>
  );
}
