import type { LiturgyData } from '../types/liturgy'
import { COR_MAP } from '../types/liturgy'
import ReadingCard from './ReadingCard'

type Props = {
  liturgiaTitulo: string
  liturgiaCor: string
  liturgyData: LiturgyData
  liturgySummary: string
}

export default function LeiturasPanel({
  liturgiaTitulo,
  liturgiaCor,
  liturgyData,
  liturgySummary,
}: Props) {
  return (
    <div className="leituras-col">

      {/* Título do dia */}
      <div className="liturgia-titulo">
        <div
          className="liturgia-cor-dot"
          style={{ backgroundColor: COR_MAP[liturgiaCor] ?? '#a08040' }}
        />
        <div className="liturgia-titulo-texto">
          <span className="liturgia-titulo-label">Liturgia do Dia</span>
          <span className="liturgia-titulo-valor">{liturgiaTitulo}</span>
        </div>
        {liturgiaCor && <span className="liturgia-cor-label">{liturgiaCor}</span>}
      </div>

      {/* Leituras */}
      <div className="leituras-card">
        <div className="leituras-header">
          <p className="leituras-header-label">✦ Leituras do Dia</p>
        </div>
        {liturgyData.leituras.primeiraLeitura.map((r: any, i: any) => (
          <ReadingCard key={i} label="Primeira Leitura" icon="📜" reading={r} />
        ))}
        {liturgyData.leituras.salmo.map((r: any, i: any) => (
          <ReadingCard key={i} label="Salmo Responsorial" icon="🎵" reading={r} />
        ))}
        {liturgyData.leituras.segundaLeitura.map((r: any, i: any) => (
          <ReadingCard key={i} label="Segunda Leitura" icon="📜" reading={r} />
        ))}
        {liturgyData.leituras.evangelho.map((r: any, i: any) => (
          <ReadingCard key={i} label="Evangelho" icon="✝️" reading={r} />
        ))}
      </div>

      {/* Resumo da IA */}
      {liturgySummary && (
        <div className="summary-card">
          <p className="summary-label">✦ Resumo da Liturgia</p>
          <p className="summary-text">{liturgySummary}</p>
        </div>
      )}

    </div>
  )
}