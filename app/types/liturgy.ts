export type Song = {
  id: string
  title: string
  artist: string
  justification: string
  letras_url?: string
}

export type Repertoire = {
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

export type ApiResponse = {
  liturgy_summary: string
  repertoire: Repertoire
  liturgia: string
  cor: string
}

export type LiturgyReading = {
  referencia: string
  titulo?: string
  texto: string
  refrao?: string
}

export type LiturgyData = {
  liturgia: string
  cor: string
  leituras: {
    primeiraLeitura: LiturgyReading[]
    segundaLeitura: LiturgyReading[]
    salmo: LiturgyReading[]
    evangelho: LiturgyReading[]
  }
}

export type CatalogSong = {
  id: string
  title: string
  artist: string
  mass_part: string[]
}

export const PART_LABELS: Record<keyof Repertoire, { label: string; icon: string }> = {
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

export const PART_TO_DB: Record<keyof Repertoire, string> = {
  entrance:      'entrada',
  penitential:   'ato_penitencial',
  gloria:        'gloria',
  acclamation:   'salmo',
  offertory:     'ofertorio',
  holy:          'santo',
  communion:     'comunhao',
  post_communion:'comunhao',
  recessional:   'final',
}

export const COR_MAP: Record<string, string> = {
  'Roxo':     '#7c3aed',
  'Verde':    '#16a34a',
  'Branco':   '#e8e0d0',
  'Vermelho': '#dc2626',
  'Rosa':     '#db2777',
}