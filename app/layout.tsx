import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono, Orbitron } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/AuthContext"
import { ThemeProvider } from "@/context/ThemeContext"
import { PomodoroProvider } from "@/context/PomodoroContext"

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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
            __html: `try{var t=localStorage.getItem('ded_theme');if(t==='cyber'||t==='jarvis'||t==='aurora')document.documentElement.classList.add(t)}catch(e){}`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${orbitron.variable} min-h-screen`}
      >
        {/* JARVIS background fx — always in DOM, visible only when html.jarvis active */}
        <div aria-hidden="true" className="jarvis-fx-grid" />
        <div aria-hidden="true" className="jarvis-fx-particles" />
        {/* Aurora background fx — always in DOM, visible only when html.aurora active */}
        <div aria-hidden="true" className="aurora-fx-bg" />

        <ThemeProvider>
          <AuthProvider>
            <PomodoroProvider>{children}</PomodoroProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
