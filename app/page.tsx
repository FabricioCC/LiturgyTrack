'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'
import { createClient } from './lib/supabase/client'
import type { User } from '@supabase/supabase-js'

import Navbar from './components/Navbar'
import LeiturasPanel from './components/LeiturasPanel'
import RepertoireCard from './components/RepertoireCard'
import SwapModal from './components/SwapModal'
import { generatePDF } from './lib/generatePDF'

import type {
  Repertoire,
  ApiResponse,
  LiturgyData,
  CatalogSong,
} from './types/liturgy'
import { PART_LABELS, PART_TO_DB } from './types/liturgy'

export default function Home() {
  const supabase = createClient()

  const [user, setUser] = useState<User | null>(null)
  const [selected, setSelected] = useState<Date>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const [repertoire, setRepertoire] = useState<Repertoire>()
  const [originalRepertoire, setOriginalRepertoire] = useState<Repertoire>()
  const [liturgySummary, setLiturgySummary] = useState<string>()
  const [liturgiaTitulo, setLiturgiaTitulo] = useState<string>()
  const [liturgiaCor, setLiturgiaCor] = useState<string>()
  const [liturgyData, setLiturgyData] = useState<LiturgyData | null>(null)

  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)

  const [swapPart, setSwapPart] = useState<keyof Repertoire | null>(null)
  const [catalog, setCatalog] = useState<CatalogSong[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleGenerate() {
    if (!selected) return
    setLoading(true)
    setError(undefined)
    setRepertoire(undefined)
    setOriginalRepertoire(undefined)
    setLiturgySummary(undefined)
    setLiturgiaTitulo(undefined)
    setLiturgiaCor(undefined)
    setLiturgyData(null)
    setConfirmed(false)

    try {
      const date = format(selected, 'yyyy-MM-dd')

      const liturgyRes = await fetch(`/api/liturgy?date=${date}`)
      if (!liturgyRes.ok) throw new Error('Falha ao buscar a liturgia do dia.')
      const liturgy = await liturgyRes.json()
      setLiturgyData(liturgy)

      const repertoireRes = await fetch('/api/repertoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, liturgy, user_id: user?.id ?? null }),
      })
      if (!repertoireRes.ok) throw new Error('Falha ao gerar o repertório.')
      const data: ApiResponse = await repertoireRes.json()

      setRepertoire(data.repertoire)
      setOriginalRepertoire(data.repertoire)
      setLiturgySummary(data.liturgy_summary)
      setLiturgiaTitulo(data.liturgia)
      setLiturgiaCor(data.cor)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenSwap(part: keyof Repertoire) {
    setSwapPart(part)
    setLoadingCatalog(true)
    setCatalog([])
    const { data } = await supabase
      .from('songs')
      .select('id, title, artist, mass_part')
      .eq('is_active', true)
      .contains('mass_part', [PART_TO_DB[part]])
      .order('title')
    setCatalog(data ?? [])
    setLoadingCatalog(false)
  }

  function handleSwapSong(part: keyof Repertoire, song: CatalogSong) {
    if (!repertoire) return
    setRepertoire({
      ...repertoire,
      [part]: { id: song.id, title: song.title, artist: song.artist, justification: 'Música escolhida manualmente.' },
    })
    setSwapPart(null)
  }

  async function handleConfirm() {
    if (!repertoire || !originalRepertoire) return
    setConfirming(true)
    const feedbacks = (Object.keys(PART_LABELS) as (keyof Repertoire)[]).map((part) => ({
      mass_part: PART_TO_DB[part],
      suggested_song_id: originalRepertoire[part]?.id,
      chosen_song_id: repertoire[part]?.id,
      was_accepted: originalRepertoire[part]?.id === repertoire[part]?.id,
    }))
    await fetch('/api/repertoire/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user?.id ?? null, feedbacks }),
    })
    setConfirmed(true)
    setConfirming(false)
  }

  async function handleGeneratePDF() {
    if (!repertoire || !selected) return
    setGeneratingPDF(true)
    try {
      await generatePDF(repertoire, liturgiaTitulo ?? '', liturgySummary ?? '', selected)
    } finally {
      setGeneratingPDF(false)
    }
  }

  const hasResults = !!(liturgiaTitulo || liturgyData || repertoire)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #0f0e0c; color: #e8e0d0; font-family: 'Outfit', sans-serif; min-height: 100vh; }

        /* NAVBAR */
        .navbar {
          position: sticky; top: 0; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 24px;
          background: rgba(15,14,12,0.85); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(160,128,64,0.1);
        }
        .navbar-brand { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: #f0e8d8; }
        .navbar-brand span { color: #c8a050; font-style: italic; }
        .navbar-user { display: flex; align-items: center; gap: 10px; }
        .navbar-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, #c8a050, #a07030);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; color: #0f0e0c; flex-shrink: 0;
        }
        .navbar-email { font-size: 12px; color: #807060; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .navbar-signout {
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: #605040; background: none; border: 1px solid rgba(160,128,64,0.2); border-radius: 6px;
          padding: 5px 10px; cursor: pointer; transition: all 0.15s ease; font-family: 'Outfit', sans-serif;
        }
        .navbar-signout:hover { color: #c8a050; border-color: rgba(160,128,64,0.5); }
        .navbar-signin {
          font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase;
          color: #a08040; background: none; border: 1px solid rgba(160,128,64,0.3); border-radius: 6px;
          padding: 5px 12px; cursor: pointer; transition: all 0.15s ease; font-family: 'Outfit', sans-serif;
        }
        .navbar-signin:hover { color: #c8a050; border-color: rgba(160,128,64,0.6); }

        /* PAGE */
        .page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180,140,80,0.15) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(120,80,40,0.1) 0%, transparent 60%),
            #0f0e0c;
          padding: 48px 24px 80px;
        }

        .container {
          max-width: 720px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 32px;
        }
        .container-wide {
          max-width: 1200px; margin: 0 auto;
          display: flex; flex-direction: column; gap: 32px;
        }

        /* HEADER */
        .header { text-align: center; padding-top: 16px; }
        .header-eyebrow { font-size: 11px; font-weight: 500; letter-spacing: 0.25em; text-transform: uppercase; color: #a08040; margin-bottom: 12px; }
        .header h1 { font-family: 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 6vw, 3.6rem); font-weight: 600; color: #f0e8d8; line-height: 1.1; letter-spacing: -0.01em; }
        .header h1 span { color: #c8a050; font-style: italic; }
        .header p { margin-top: 12px; font-size: 14px; font-weight: 300; color: #807060; letter-spacing: 0.02em; }

        .divider { display: flex; align-items: center; gap: 12px; opacity: 0.3; }
        .divider-line { flex: 1; height: 1px; background: #a08040; }
        .divider-icon { font-size: 14px; color: #a08040; }

        /* DATE PICKER CARD */
        .card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(160,128,64,0.15);
          border-radius: 20px; padding: 32px; backdrop-filter: blur(8px);
          position: relative; z-index: 20;
        }
        .picker-wrapper { display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .rdp { --rdp-accent-color: #c8a050 !important; --rdp-background-color: rgba(200,160,80,0.1) !important; color: #e8e0d0 !important; margin: 0 !important; }
        .rdp-day_selected, .rdp-day_selected:hover { background-color: #c8a050 !important; color: #0f0e0c !important; font-weight: 600 !important; }
        .rdp-day:hover:not(.rdp-day_selected) { background: rgba(200,160,80,0.15) !important; color: #c8a050 !important; }
        .rdp-caption_label { font-family: 'Cormorant Garamond', serif !important; font-size: 1.1rem !important; font-weight: 600 !important; color: #f0e8d8 !important; }
        .rdp-head_cell { color: #a08040 !important; font-size: 11px !important; font-weight: 500 !important; letter-spacing: 0.08em !important; }
        .rdp-nav_button { color: #a08040 !important; }
        .rdp-day_outside { opacity: 0.25 !important; }
        .selected-date { font-size: 13px; color: #a08040; letter-spacing: 0.04em; }
        .selected-date strong { color: #e8d8b0; font-weight: 500; }

        /* BUTTONS */
        .btn { width: 100%; padding: 16px 24px; border-radius: 12px; border: none; cursor: pointer; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; transition: all 0.2s ease; }
        .btn-primary { background: linear-gradient(135deg, #c8a050 0%, #a07030 100%); color: #0f0e0c; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(200,160,80,0.3); }
        .btn-primary:disabled { background: rgba(255,255,255,0.06); color: #504840; cursor: not-allowed; }
        .btn-confirm { background: rgba(200,160,80,0.1); border: 1px solid rgba(200,160,80,0.3); color: #c8a050; }
        .btn-confirm:hover:not(:disabled) { background: rgba(200,160,80,0.18); }
        .btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-pdf { background: rgba(255,255,255,0.03); border: 1px solid rgba(160,128,64,0.15); color: #807060; }
        .btn-pdf:hover:not(:disabled) { background: rgba(255,255,255,0.06); color: #a08040; border-color: rgba(160,128,64,0.3); }
        .btn-pdf:disabled { opacity: 0.4; cursor: not-allowed; }

        /* LOADING / ERROR */
        .loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 40px 0; }
        .loading-cross { font-size: 2rem; animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.9); } }
        .loading-text { font-size: 13px; color: #807060; letter-spacing: 0.08em; text-transform: uppercase; }
        .error-box { background: rgba(200,60,60,0.08); border: 1px solid rgba(200,60,60,0.2); border-radius: 10px; padding: 12px 16px; font-size: 13px; color: #e08080; text-align: center; }
        .success-box { background: rgba(80,160,80,0.08); border: 1px solid rgba(80,160,80,0.2); border-radius: 10px; padding: 14px 16px; font-size: 13px; color: #80c080; text-align: center; letter-spacing: 0.02em; }

        /* LITURGIA TÍTULO */
        .liturgia-titulo { display: flex; align-items: center; gap: 12px; padding: 20px 28px; background: rgba(255,255,255,0.02); border: 1px solid rgba(160,128,64,0.15); border-radius: 14px; }
        .liturgia-cor-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.15); }
        .liturgia-titulo-texto { display: flex; flex-direction: column; gap: 2px; }
        .liturgia-titulo-label { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #a08040; }
        .liturgia-titulo-valor { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: #f0e8d8; }
        .liturgia-cor-label { margin-left: auto; font-size: 11px; color: #605040; letter-spacing: 0.04em; }

        /* LEITURAS */
        .leituras-col { display: flex; flex-direction: column; gap: 20px; }
        .leituras-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(160,128,64,0.12); border-radius: 20px; overflow: hidden; }
        .leituras-header { padding: 20px 28px 16px; border-bottom: 1px solid rgba(160,128,64,0.08); }
        .leituras-header-label { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #a08040; }
        .reading-card { border-bottom: 1px solid rgba(255,255,255,0.04); }
        .reading-card:last-child { border-bottom: none; }
        .reading-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 16px 28px; background: none; border: none; cursor: pointer; transition: background 0.15s ease; text-align: left; gap: 12px; }
        .reading-header:hover { background: rgba(255,255,255,0.02); }
        .reading-header-left { display: flex; align-items: center; gap: 12px; }
        .reading-icon { font-size: 1.1rem; flex-shrink: 0; }
        .reading-label { font-size: 10px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #a08040; margin-bottom: 2px; }
        .reading-ref { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: #f0e8d8; }
        .reading-chevron { font-size: 9px; color: #605040; flex-shrink: 0; }
        .reading-body { padding: 0 28px 20px; }
        .reading-titulo { font-size: 11px; font-weight: 500; letter-spacing: 0.06em; color: #807060; margin-bottom: 12px; font-style: italic; }
        .reading-refrao { font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: #c8a050; font-style: italic; margin-bottom: 12px; padding: 8px 12px; background: rgba(200,160,80,0.06); border-left: 2px solid rgba(200,160,80,0.3); border-radius: 0 6px 6px 0; }
        .reading-texto { font-family: 'Cormorant Garamond', serif; font-size: 1rem; line-height: 1.8; color: #c8baa8; white-space: pre-line; }

        /* SUMMARY */
        .summary-card { background: rgba(200,160,80,0.05); border: 1px solid rgba(200,160,80,0.2); border-radius: 20px; padding: 28px 32px; }
        .summary-label { font-size: 10px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: #a08040; margin-bottom: 12px; }
        .summary-text { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; line-height: 1.75; color: #d8cdb8; font-style: italic; }

        /* REPERTOIRE */
        .repertoire-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(160,128,64,0.15); border-radius: 20px; overflow: hidden; }
        .repertoire-header { padding: 24px 32px 20px; border-bottom: 1px solid rgba(160,128,64,0.1); }
        .repertoire-header h2 { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; color: #f0e8d8; }
        .repertoire-header p { font-size: 12px; color: #605040; margin-top: 4px; letter-spacing: 0.04em; }
        .song-item { display: grid; grid-template-columns: 48px 1fr auto; gap: 0 16px; padding: 20px 32px; border-bottom: 1px solid rgba(255,255,255,0.04); transition: background 0.15s ease; align-items: start; }
        .song-item:last-child { border-bottom: none; }
        .song-item:hover { background: rgba(255,255,255,0.02); }
        .song-icon-col { display: flex; flex-direction: column; align-items: center; padding-top: 2px; gap: 6px; }
        .song-icon { font-size: 1.2rem; line-height: 1; }
        .song-icon-line { width: 1px; flex: 1; min-height: 20px; background: rgba(160,128,64,0.15); }
        .song-item:last-child .song-icon-line { display: none; }
        .song-part { font-size: 10px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #a08040; margin-bottom: 4px; }
        .song-title { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: #f0e8d8; line-height: 1.2; }
        .song-artist { font-size: 12px; color: #706050; margin-top: 2px; }
        .song-letras-link { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #a08040; text-decoration: none; margin-top: 6px; letter-spacing: 0.04em; transition: color 0.15s ease; }
        .song-letras-link:hover { color: #c8a050; }
        .song-justification { font-size: 12px; color: #908070; margin-top: 8px; line-height: 1.5; font-style: italic; }
        .song-swap-btn { background: none; border: 1px solid rgba(160,128,64,0.2); border-radius: 6px; color: #605040; font-size: 11px; font-family: 'Outfit', sans-serif; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase; padding: 5px 10px; cursor: pointer; transition: all 0.15s ease; white-space: nowrap; margin-top: 2px; }
        .song-swap-btn:hover { color: #c8a050; border-color: rgba(160,128,64,0.5); }
        .song-swapped { font-size: 10px; color: #c8a050; letter-spacing: 0.06em; margin-top: 4px; }
        .repertoire-footer { padding: 20px 32px; border-top: 1px solid rgba(160,128,64,0.1); display: flex; flex-direction: column; gap: 8px; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 24px; }
        .modal { background: #1a1814; border: 1px solid rgba(160,128,64,0.2); border-radius: 20px; width: 100%; max-width: 480px; max-height: 80vh; display: flex; flex-direction: column; overflow: hidden; }
        .modal-header { padding: 20px 24px; border-bottom: 1px solid rgba(160,128,64,0.1); display: flex; align-items: center; justify-content: space-between; }
        .modal-title { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: #f0e8d8; }
        .modal-close { background: none; border: none; color: #605040; font-size: 1.2rem; cursor: pointer; padding: 4px; line-height: 1; }
        .modal-close:hover { color: #c8a050; }
        .modal-body { overflow-y: auto; flex: 1; }
        .modal-song-item { padding: 14px 24px; border-bottom: 1px solid rgba(255,255,255,0.04); cursor: pointer; transition: background 0.15s ease; }
        .modal-song-item:hover { background: rgba(255,255,255,0.04); }
        .modal-song-item:last-child { border-bottom: none; }
        .modal-song-title { font-family: 'Cormorant Garamond', serif; font-size: 1.05rem; font-weight: 600; color: #f0e8d8; }
        .modal-song-artist { font-size: 12px; color: #706050; margin-top: 2px; }
        .modal-loading { padding: 32px; text-align: center; font-size: 13px; color: #605040; letter-spacing: 0.08em; }

        /* TWO COLUMN RESULTS */
        .results-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          align-items: start;
        }
        .results-col-right {
          position: sticky;
          top: 80px;
        }
        @media (max-width: 768px) {
          .results-grid { grid-template-columns: 1fr; }
          .results-col-right { position: static; }
        }
      `}</style>

      <Navbar user={user} onSignOut={handleSignOut} />

      <div className="page">

        {/* PRE-RESULTS: header + date picker — narrow container */}
        {!hasResults && (
          <div className="container">
            <div className="header">
              <p className="header-eyebrow">✦ Planejamento Litúrgico ✦</p>
              <h1>Liturgia<span>Track</span></h1>
              <p>Selecione a data da Missa para gerar o repertório com IA</p>
            </div>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-icon">✦</span>
              <div className="divider-line" />
            </div>

            <div className="card">
              <div className="picker-wrapper">
                <DayPicker mode="single" selected={selected} onSelect={setSelected} locale={ptBR} />
                {selected && (
                  <p className="selected-date">
                    Data selecionada:{' '}
                    <strong>{format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
                  </p>
                )}
                <button className="btn btn-primary" onClick={handleGenerate} disabled={!selected || loading}>
                  {loading ? 'Gerando repertório...' : '✦ Gerar Repertório'}
                </button>
                {error && <div className="error-box">{error}</div>}
              </div>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="container">
            <div className="loading-state">
              <div className="loading-cross">✝</div>
              <p className="loading-text">Consultando a liturgia do dia...</p>
            </div>
          </div>
        )}

        {/* POST-RESULTS: wide two-column layout */}
        {hasResults && !loading && (
          <div className="container-wide">

            {/* Nova busca */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn btn-primary"
                style={{ maxWidth: 320 }}
                onClick={() => {
                  setRepertoire(undefined)
                  setOriginalRepertoire(undefined)
                  setLiturgyData(null)
                  setLiturgySummary(undefined)
                  setLiturgiaTitulo(undefined)
                  setLiturgiaCor(undefined)
                  setConfirmed(false)
                  setSelected(undefined)
                }}
              >
                ← Nova Busca
              </button>
            </div>

            <div className="results-grid">

              {/* LEFT — Leituras */}
              <div>
                {liturgyData && liturgiaTitulo && (
                  <LeiturasPanel
                    liturgiaTitulo={liturgiaTitulo}
                    liturgiaCor={liturgiaCor ?? ''}
                    liturgyData={liturgyData}
                    liturgySummary={liturgySummary ?? ''}
                  />
                )}
              </div>

              {/* RIGHT — Repertório */}
              <div className="results-col-right">
                {repertoire && originalRepertoire && selected && (
                  <RepertoireCard
                    repertoire={repertoire}
                    originalRepertoire={originalRepertoire}
                    selected={selected}
                    confirmed={confirmed}
                    confirming={confirming}
                    generatingPDF={generatingPDF}
                    user={user}
                    onOpenSwap={handleOpenSwap}
                    onConfirm={handleConfirm}
                    onGeneratePDF={handleGeneratePDF}
                  />
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {swapPart && (
        <SwapModal
          swapPart={swapPart}
          catalog={catalog}
          loadingCatalog={loadingCatalog}
          onSwap={handleSwapSong}
          onClose={() => setSwapPart(null)}
        />
      )}
    </>
  )
}