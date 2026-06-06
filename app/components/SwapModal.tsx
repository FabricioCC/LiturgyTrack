import type { CatalogSong, Repertoire } from '../types/liturgy'
import { PART_LABELS } from '../types/liturgy'

type Props = {
  swapPart: keyof Repertoire
  catalog: CatalogSong[]
  loadingCatalog: boolean
  onSwap: (part: keyof Repertoire, song: CatalogSong) => void
  onClose: () => void
}

export default function SwapModal({ swapPart, catalog, loadingCatalog, onSwap, onClose }: Props) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Trocar — {PART_LABELS[swapPart].label}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loadingCatalog ? (
            <p className="modal-loading">Carregando músicas...</p>
          ) : catalog.length === 0 ? (
            <p className="modal-loading">Nenhuma música encontrada.</p>
          ) : (
            catalog.map((song) => (
              <div
                key={song.id}
                className="modal-song-item"
                onClick={() => onSwap(swapPart, song)}
              >
                <p className="modal-song-title">{song.title}</p>
                <p className="modal-song-artist">{song.artist}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}