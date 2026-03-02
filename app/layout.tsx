import type { Metadata } from "next"
import { Geist, Geist_Mono, Orbitron } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
})

export const metadata: Metadata = {
  title: "Daily Execution Dashboard",
  description: "Brutally simple daily task tracking",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Anti-flicker: apply saved theme class before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('ded_theme');if(t==='cyber')document.documentElement.classList.add('cyber')}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} min-h-screen`}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
