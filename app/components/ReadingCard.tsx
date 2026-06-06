'use client'

import { useState } from 'react'
import type { LiturgyReading } from '../types/liturgy'

type Props = {
  label: string
  icon: string
  reading: LiturgyReading
}

export default function ReadingCard({ label, icon, reading }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="reading-card">
      <button className="reading-header" onClick={() => setExpanded(!expanded)}>
        <div className="reading-header-left">
          <span className="reading-icon">{icon}</span>
          <div>
            <p className="reading-label">{label}</p>
            <p className="reading-ref">{reading.referencia}</p>
          </div>
        </div>
        <span className="reading-chevron">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="reading-body">
          {reading.titulo && <p className="reading-titulo">{reading.titulo}</p>}
          {reading.refrao && <p className="reading-refrao">℟ {reading.refrao}</p>}
          <p className="reading-texto">{reading.texto}</p>
        </div>
      )}
    </div>
  )
}