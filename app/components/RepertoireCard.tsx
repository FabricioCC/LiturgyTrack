import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Repertoire, CatalogSong } from '../types/liturgy'
import { PART_LABELS } from '../types/liturgy'

type Props = {
  repertoire: Repertoire
  originalRepertoire: Repertoire
  selected: Date
  confirmed: boolean
  confirming: boolean
  generatingPDF: boolean
  user: { email?: string | null } | null
  onOpenSwap: (part: keyof Repertoire) => void
  onConfirm: () => void
  onGeneratePDF: () => void
}

export default function RepertoireCard({
  repertoire,
  originalRepertoire,
  selected,
  confirmed,
  confirming,
  generatingPDF,
  user,
  onOpenSwap,
  onConfirm,
  onGeneratePDF,
}: Props) {
  return (
    <div className="repertoire-card">
      <div className="repertoire-header">
        <h2>Repertório Sugerido</h2>
        <p>{format(selected, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
      </div>

      {(Object.keys(PART_LABELS) as (keyof Repertoire)[]).map((part) => {
        const song = repertoire[part]
        const original = originalRepertoire[part]
        const wasSwapped = original?.id !== song?.id
        const { label, icon } = PART_LABELS[part]
        if (!song) return null

        console.log("Song: ", song)

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
              {song.letras_url && (
                <a
                  href={song.letras_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="song-letras-link"
                >
                  ♪ Ver letra
                </a>
              )}
              <p className="song-justification">{song.justification}</p>
              {wasSwapped && <p className="song-swapped">✦ Trocada manualmente</p>}
            </div>
            {!confirmed && (
              <button className="song-swap-btn" onClick={() => onOpenSwap(part)}>
                Trocar
              </button>
            )}
          </div>
        )
      })}

      <div className="repertoire-footer">
        {confirmed ? (
          <>
            <div className="success-box">
              ✦ Repertório confirmado!{user ? ' Suas preferências foram salvas.' : ''}
            </div>
            <button className="btn btn-pdf" onClick={onGeneratePDF} disabled={generatingPDF}>
              {generatingPDF ? 'Gerando PDF...' : '↓ Baixar PDF'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-confirm" onClick={onConfirm} disabled={confirming}>
              {confirming ? 'Salvando...' : '✦ Confirmar Repertório'}
            </button>
            {!user && (
              <p style={{ fontSize: '11px', color: '#605040', textAlign: 'center', letterSpacing: '0.02em' }}>
                Entre com sua conta para salvar preferências e melhorar as sugestões ao longo do tempo.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}