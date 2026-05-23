import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CipherVault | Secure E2E Encrypted Sharing",
  description: "Securely encrypt, store, and share files and messages with end-to-end encryption.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased min-h-screen selection:bg-security/30 selection:text-security">
        <ThemeProvider>
          <AuthProvider>
            <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
              <div className="relative z-10 flex flex-col min-h-screen">
                {children}
              </div>
            </div>
            <Toaster 
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#111111',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '12px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#4ADE80',
                    secondary: '#000',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
