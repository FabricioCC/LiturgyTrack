import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

function detectLiturgicalTime(liturgyText: string): string {
  const t = liturgyText.toLowerCase()
  if (t.includes('quaresma')) return 'quaresma'
  if (t.includes('advento'))  return 'advento'
  if (t.includes('natal'))    return 'natal'
  if (t.includes('pascal') || t.includes('páscoa') || t.includes('pascoa')) return 'pascal'
  return 'comum'
}

async function getUserPreferences(userId: string | null): Promise<string> {
  if (!userId) return ''

  const { data } = await supabase
    .from('repertoire_feedback')
    .select(`
      mass_part,
      was_accepted,
      chosen:chosen_song_id (title, artist)
    `)
    .eq('user_id', userId)
    .eq('was_accepted', true)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data || data.length === 0) return ''

  // Group by mass part and count frequency
  const freq: Record<string, Record<string, number>> = {}
  for (const row of data) {
    const part = row.mass_part
    const song = row.chosen as any
    if (!song) continue
    const key = `${song.title} — ${song.artist}`
    if (!freq[part]) freq[part] = {}
    freq[part][key] = (freq[part][key] ?? 0) + 1
  }

  const lines = Object.entries(freq).map(([part, songs]) => {
    const top = Object.entries(songs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([name, count]) => `"${name}" (${count}x)`)
      .join(', ')
    return `- ${part}: ${top}`
  })

  return `
Histórico de preferências deste músico (use como critério de desempate, nunca sobre a liturgia):
${lines.join('\n')}
`
}

export async function POST(req: NextRequest) {
  const { date, liturgy, user_id } = await req.json()

  if (!date || !liturgy) {
    return NextResponse.json({ error: 'Date and liturgy are required' }, { status: 400 })
  }

  console.log(`\n📅 Generating repertoire for ${date}`)

  const liturgicalTime = detectLiturgicalTime(liturgy.liturgia ?? '')
  console.log(`🕯️ Liturgical time detected: ${liturgicalTime}`)

  const [songsResult, preferences] = await Promise.all([
    supabase
      .from('songs')
      .select('id, title, artist, mass_part, themes, is_paroquial, letras_url')
      .eq('is_active', true)
      .or(`liturgical_time.cs.{"${liturgicalTime}"},liturgical_time.cs.{"comum"}`)
      .order('is_paroquial', { ascending: false }),
    getUserPreferences(user_id ?? null),
  ])

  if (songsResult.error) {
    console.error('❌ Failed to fetch songs:', songsResult.error)
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
  }

  const songs = songsResult.data
  console.log(`🎵 Filtered catalog: ${songs.length} songs for "${liturgicalTime}"`)
  if (preferences) console.log('👤 User preferences loaded')

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
Você é um especialista em música litúrgica católica brasileira.
Responda SEMPRE em português do Brasil.

A liturgia do dia ${date} (${liturgy.liturgia ?? ''}) contém:
- Evangelho: ${liturgy.evangelhoRef ?? ''} — ${liturgy.evangelho ?? ''}
- Primeira Leitura: ${liturgy.primeiraLeituraRef ?? ''} — ${liturgy.primeiraLeitura ?? ''}
- Salmo: ${liturgy.salmoRef ?? ''}
- Segunda Leitura: ${liturgy.segundaLeituraRef ?? ''} — ${liturgy.segundaLeitura ?? ''}

${preferences}

Sua tarefa tem duas partes:

PARTE 1 — Resumo da liturgia:
Escreva um resumo curto (3 a 5 frases) explicando o tema principal e a mensagem da liturgia de hoje.

PARTE 2 — Escolha das músicas:
Com base nos textos da liturgia e no catálogo abaixo, sugira uma música para cada parte da Missa.
Se houver histórico de preferências, use-o como critério de desempate entre músicas igualmente adequadas.
A adequação à liturgia do dia é sempre a prioridade máxima.
O campo "justification" deve explicar em português por que a música se encaixa na liturgia do dia.

CATÁLOGO:
${JSON.stringify(songs)}

Retorne APENAS um objeto JSON neste formato exato, sem texto adicional:
{
  "liturgy_summary": "Resumo em português aqui...",
  "repertoire": {
    "entrance":       { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." },
    "penitential":    { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." },
    "gloria":         { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." },
    "acclamation":    { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." },
    "offertory":      { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." },
    "holy":           { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." },
    "communion":      { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." },
    "post_communion": { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." },
    "recessional":    { "id": "uuid", "title": "...", "artist": "...", "justification": "...", letras_url: "https://..." }
  }
}
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    return NextResponse.json({
      ...parsed,
      liturgia: liturgy.liturgia ?? '',
      cor: liturgy.cor ?? '',
    })
  } catch (err) {
    console.error('❌ Failed to process Gemini response:', err)
    return NextResponse.json({ error: 'Failed to parse Gemini response' }, { status: 500 })
  }
}