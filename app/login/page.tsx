'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const supabase = createClient()

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #0f0e0c; font-family: 'Outfit', sans-serif; }
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180,140,80,0.15) 0%, transparent 70%),
            #0f0e0c;
          padding: 24px;
        }
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(160,128,64,0.15);
          border-radius: 24px;
          padding: 48px 40px;
          width: 100%;
          max-width: 400px;
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .eyebrow {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #a08040;
        }
        h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.8rem;
          font-weight: 600;
          color: #f0e8d8;
          line-height: 1.1;
        }
        h1 span { color: #c8a050; font-style: italic; }
        p {
          font-size: 14px;
          font-weight: 300;
          color: #807060;
          line-height: 1.6;
        }
        .btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          width: 100%;
          padding: 16px 24px;
          border-radius: 12px;
          border: 1px solid rgba(160,128,64,0.3);
          background: rgba(255,255,255,0.04);
          color: #e8e0d0;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          letter-spacing: 0.02em;
        }
        .btn-google:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(160,128,64,0.5);
          transform: translateY(-1px);
        }
        .google-icon { width: 18px; height: 18px; }
      `}</style>

      <div className="page">
        <div className="card">
          <p className="eyebrow">✦ Planejamento Litúrgico ✦</p>
          <h1>Liturgia<span>Track</span></h1>
          <p>Entre com sua conta para gerar repertórios e salvar suas preferências musicais.</p>
          <button className="btn-google" onClick={handleGoogleLogin}>
            <svg className="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
    </>
  )
}