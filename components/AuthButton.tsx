"use client"

import { useAuth, signInWithGoogle, signOutUser } from "@/context/AuthContext"

export default function AuthButton() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 rounded transition-colors"
      >
        Sign in with Google
      </button>
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
