'use client'

import type { User } from '@supabase/supabase-js'

type Props = {
  user: User | null
  onSignOut: () => void
}

export default function Navbar({ user, onSignOut }: Props) {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Liturgia<span>Track</span></span>
      <div className="navbar-user">
        {user ? (
          <>
            <div className="navbar-avatar">{user.email?.[0].toUpperCase()}</div>
            <span className="navbar-email">{user.email}</span>
            <button className="navbar-signout" onClick={onSignOut}>Sair</button>
          </>
        ) : (
          <button
            className="navbar-signin"
            onClick={() => window.location.href = '/login'}
          >
            Entrar
          </button>
        )}
      </div>
    </nav>
  )
}