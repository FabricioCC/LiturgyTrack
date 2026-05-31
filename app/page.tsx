'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/dist/style.css'

type Song = {
  id: string
  title: string
  artist: string
  justification: string
}

type Repertoire = {
  entrance: Song
  penitential: Song
  gloria: Song
  acclamation: Song
  offertory: Song
  holy: Song
  communion: Song
  post_communion: Song
  recessional: Song
}

type ApiResponse = {
  liturgy_summary: string
  repertoire: Repertoire
}

const PART_LABELS: Record<keyof Repertoire, { label: string; icon: string }> = {
  entrance:      { label: 'Entrada',         icon: '🚪' },
  penitential:   { label: 'Ato Penitencial', icon: '🙏' },
  gloria:        { label: 'Glória',          icon: '✨' },
  acclamation:   { label: 'Aclamação',       icon: '📖' },
  offertory:     { label: 'Ofertório',       icon: '🕯️' },
  holy:          { label: 'Santo',           icon: '⛪' },
  communion:     { label: 'Comunhão',        icon: '🍞' },
  post_communion:{ label: 'Pós-Comunhão',    icon: '🤲' },
  recessional:   { label: 'Final',           icon: '🎶' },
}

export default function Home() {
  const [selected, setSelected] = useState<Date>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const [repertoire, setRepertoire] = useState<Repertoire>()
  const [liturgySummary, setLiturgySummary] = useState<string>()

  async function handleGenerate() {
    if (!selected) return

    setLoading(true)
    setError(undefined)
    setRepertoire(undefined)
    setLiturgySummary(undefined)

    try {
      const date = format(selected, 'yyyy-MM-dd')

      const liturgyRes = await fetch(`/api/liturgy?date=${date}`)
      if (!liturgyRes.ok) throw new Error('Falha ao buscar a liturgia do dia.')
      const liturgy = await liturgyRes.json()

      const repertoireRes = await fetch('/api/repertoire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, liturgy }),
      })
      if (!repertoireRes.ok) throw new Error('Falha ao gerar o repertório.')
      const data: ApiResponse = await repertoireRes.json()

      setRepertoire(data.repertoire)
      setLiturgySummary(data.liturgy_summary)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background-color: #0f0e0c;
          color: #e8e0d0;
          font-family: 'Outfit', sans-serif;
          min-height: 100vh;
        }

        .page {
          min-height: 100vh;
          background:
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180,140,80,0.15) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 80% 80%, rgba(120,80,40,0.1) 0%, transparent 60%),
            #0f0e0c;
          padding: 48px 16px 80px;
        }

        .container {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* HEADER */
        .header {
          text-align: center;
          padding-top: 16px;
        }
        .header-eyebrow {
          font-family: 'Outfit', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #a08040;
          margin-bottom: 12px;
        }
        .header h1 {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.4rem, 6vw, 3.6rem);
          font-weight: 600;
          color: #f0e8d8;
          line-height: 1.1;
          letter-spacing: -0.01em;
        }
        .header h1 span {
          color: #c8a050;
          font-style: italic;
        }
        .header p {
          margin-top: 12px;
          font-size: 14px;
          font-weight: 300;
          color: #807060;
          letter-spacing: 0.02em;
        }

        /* DIVIDER */
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          opacity: 0.3;
        }
        .divider-line { flex: 1; height: 1px; background: #a08040; }
        .divider-icon { font-size: 14px; color: #a08040; }

        /* CARD */
        .card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(160,128,64,0.15);
          border-radius: 20px;
          padding: 32px;
          backdrop-filter: blur(8px);
        }

        /* DATE PICKER */
        .picker-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }

        .rdp {
          --rdp-accent-color: #c8a050 !important;
          --rdp-background-color: rgba(200,160,80,0.1) !important;
          --rdp-accent-color-dark: #c8a050 !important;
          --rdp-background-color-dark: rgba(200,160,80,0.1) !important;
          color: #e8e0d0 !important;
          margin: 0 !important;
        }
        .rdp-day_selected, .rdp-day_selected:hover {
          background-color: #c8a050 !important;
          color: #0f0e0c !important;
          font-weight: 600 !important;
        }
        .rdp-day:hover:not(.rdp-day_selected) {
          background: rgba(200,160,80,0.15) !important;
          color: #c8a050 !important;
        }
        .rdp-caption_label {
          font-family: 'Cormorant Garamond', serif !important;
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          color: #f0e8d8 !important;
        }
        .rdp-head_cell {
          color: #a08040 !important;
          font-size: 11px !important;
          font-weight: 500 !important;
          letter-spacing: 0.08em !important;
        }
        .rdp-nav_button {
          color: #a08040 !important;
        }
        .rdp-day_outside { opacity: 0.25 !important; }

        .selected-date {
          font-size: 13px;
          color: #a08040;
          letter-spacing: 0.04em;
        }
        .selected-date strong {
          color: #e8d8b0;
          font-weight: 500;
        }

        /* BUTTON */
        .btn {
          width: 100%;
          padding: 16px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .btn-primary {
          background: linear-gradient(135deg, #c8a050 0%, #a07030 100%);
          color: #0f0e0c;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(200,160,80,0.3);
        }
        .btn-primary:disabled {
          background: rgba(255,255,255,0.06);
          color: #504840;
          cursor: not-allowed;
        }

        /* LOADING */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 0;
        }
        .loading-cross {
          font-size: 2rem;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.9); }
        }
        .loading-text {
          font-size: 13px;
          color: #807060;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ERROR */
        .error-box {
          background: rgba(200,60,60,0.08);
          border: 1px solid rgba(200,60,60,0.2);
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 13px;
          color: #e08080;
          text-align: center;
        }

        /* SUMMARY */
        .summary-card {
          background: rgba(200,160,80,0.05);
          border: 1px solid rgba(200,160,80,0.2);
          border-radius: 20px;
          padding: 28px 32px;
        }
        .summary-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #a08040;
          margin-bottom: 12px;
        }
        .summary-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          line-height: 1.75;
          color: #d8cdb8;
          font-style: italic;
        }

        /* REPERTOIRE */
        .repertoire-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(160,128,64,0.15);
          border-radius: 20px;
          overflow: hidden;
        }
        .repertoire-header {
          padding: 24px 32px 20px;
          border-bottom: 1px solid rgba(160,128,64,0.1);
        }
        .repertoire-header h2 {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #f0e8d8;
        }
        .repertoire-header p {
          font-size: 12px;
          color: #605040;
          margin-top: 4px;
          letter-spacing: 0.04em;
        }

        .song-item {
          display: grid;
          grid-template-columns: 48px 1fr;
          gap: 0 16px;
          padding: 20px 32px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s ease;
        }
        .song-item:last-child { border-bottom: none; }
        .song-item:hover { background: rgba(255,255,255,0.02); }

        .song-icon-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-top: 2px;
          gap: 6px;
        }
        .song-icon {
          font-size: 1.2rem;
          line-height: 1;
        }
        .song-icon-line {
          width: 1px;
          flex: 1;
          min-height: 20px;
          background: rgba(160,128,64,0.15);
        }
        .song-item:last-child .song-icon-line { display: none; }

        .song-part {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #a08040;
          margin-bottom: 4px;
        }
        .song-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #f0e8d8;
          line-height: 1.2;
        }
        .song-artist {
          font-size: 12px;
          color: #706050;
          margin-top: 2px;
        }
        .song-justification {
          font-size: 12px;
          color: #908070;
          margin-top: 8px;
          line-height: 1.5;
          font-style: italic;
        }
      `}</style>

      <div className="page">
        <div className="container">

          {/* Header */}
          <div className="header">
            <p className="header-eyebrow">✦ Planejamento Litúrgico ✦</p>
            <h1>Liturgia<span>Track</span></h1>
            <p>Selecione a data da missa para gerar o repertório com IA</p>
          </div>

          <div className="divider">
            <div className="divider-line" />
            <span className="divider-icon">✦</span>
            <div className="divider-line" />
          </div>

          {/* Date Picker Card */}
          <div className="card">
            <div className="picker-wrapper">
              <DayPicker
                mode="single"
                selected={selected}
                onSelect={setSelected}
                locale={ptBR}
              />

              {selected && (
                <p className="selected-date">
                  Data selecionada:{' '}
                  <strong>{format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</strong>
                </p>
              )}

              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={!selected || loading}
              >
                {loading ? 'Gerando repertório...' : '✦ Gerar Repertório'}
              </button>

              {error && <div className="error-box">{error}</div>}
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="loading-state">
              <div className="loading-cross">✝</div>
              <p className="loading-text">Consultando a liturgia do dia...</p>
            </div>
          )}

          {/* Liturgy Summary */}
          {liturgySummary && (
            <div className="summary-card">
              <p className="summary-label">✦ Resumo da Liturgia</p>
              <p className="summary-text">{liturgySummary}</p>
            </div>
          )}

          {/* Repertoire */}
          {repertoire && (
            <div className="repertoire-card">
              <div className="repertoire-header">
                <h2>Repertório Sugerido</h2>
                <p>
                  {selected
                    ? format(selected, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : ''}
                </p>
              </div>

              {(Object.keys(PART_LABELS) as (keyof Repertoire)[]).map((part) => {
                const song = repertoire[part]
                const { label, icon } = PART_LABELS[part]
                if (!song) return null
                return (
                  <div key={part} className="song-item">
                    <div className="song-icon-col">
                      <span className="song-icon">{icon}</span>
                      <div className="song-icon-line" />
                    </div>
                    <div>
                      <p className="song-part">{label}</p>
                      <p className="song-title">{song.title}</p>
                      <p className="song-artist">{song.artist}</p>
                      <p className="song-justification">{song.justification}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </>
  )
}