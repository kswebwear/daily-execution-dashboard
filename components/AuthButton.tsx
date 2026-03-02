"use client"

import { useState } from "react"
import { useAuth, signInWithGoogle, signOutUser } from "@/context/AuthContext"

export default function AuthButton() {
  const { user, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  async function handleSignIn() {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ""
      if (code === "auth/popup-blocked") {
        setError("Popup blocked — allow popups for this site and try again.")
      } else if (code === "auth/popup-closed-by-user") {
        setError(null) // user dismissed, no message needed
      } else {
        setError("Sign-in failed. Check console for details.")
        console.error("[AuthButton] sign-in error:", err)
      }
    }
  }

  if (loading) return null

  if (!user) {
    return (
      <div className="flex flex-col items-end gap-1">
        <button
          onClick={handleSignIn}
          className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
        >
          Sign in with Google
        </button>
        {error && <p className="text-xs text-red-500 max-w-[200px] text-right">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-600 truncate max-w-[160px]">{user.email}</span>
      <button
        onClick={signOutUser}
        className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
