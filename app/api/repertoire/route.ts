import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

function detectLiturgicalTime(liturgiaText: string): string {
  const t = liturgiaText.toLowerCase()
  if (t.includes('quaresma'))  return 'quaresma'
  if (t.includes('advento'))   return 'advento'
  if (t.includes('natal'))     return 'natal'
  if (t.includes('pascal') || t.includes('páscoa') || t.includes('pascoa')) return 'pascal'
  return 'comum'
}

export async function POST(req: NextRequest) {
  const { date, liturgy } = await req.json()

  if (!date || !liturgy) {
    return NextResponse.json({ error: 'Date and liturgy are required' }, { status: 400 })
  }

  console.log(`\n📅 Generating repertoire for ${date}`)

  const liturgicalTime = detectLiturgicalTime(liturgy.liturgia ?? '')
  console.log(`🕯️ Tempo litúrgico detectado: ${liturgicalTime}`)

  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, artist, mass_part, themes, is_paroquial')
    .eq('is_active', true)
    .or(`liturgical_time.cs.{"${liturgicalTime}"},liturgical_time.cs.{"comum"}`)
    .order('is_paroquial', { ascending: false })

  if (error) {
    console.error('❌ Failed to fetch songs:', error)
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
  }

  console.log(`🎵 Catálogo filtrado: ${songs.length} músicas para o tempo "${liturgicalTime}"`)

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
Você é um especialista em música litúrgica católica brasileira.
Responda SEMPRE em português do Brasil.

A liturgia do dia ${date} (${liturgy.liturgia ?? ''}) contém:
- Evangelho: ${liturgy.evangelhoRef ?? ''} — ${liturgy.evangelho ?? ''}
- Primeira Leitura: ${liturgy.primeiraLeituraRef ?? ''} — ${liturgy.primeiraLeitura ?? ''}
- Salmo: ${liturgy.salmoRef ?? ''}
- Segunda Leitura: ${liturgy.segundaLeituraRef ?? ''} — ${liturgy.segundaLeitura ?? ''}

Sua tarefa tem duas partes:

PARTE 1 — Resumo da liturgia:
Escreva um resumo curto (3 a 5 frases) explicando o tema principal e a mensagem da liturgia de hoje.
Isso ajudará o músico a entender o contexto espiritual da Missa.

PARTE 2 — Escolha das músicas:
Com base nos textos da liturgia e no catálogo abaixo, sugira uma música para cada parte da Missa.
Prefira músicas com is_paroquial: true quando disponíveis.
O campo "justification" deve explicar em português por que a música se encaixa na liturgia do dia.

CATÁLOGO (já filtrado para o tempo litúrgico de hoje):
${JSON.stringify(songs)}

Retorne APENAS um objeto JSON neste formato exato, sem texto adicional:
{
  "liturgy_summary": "Resumo em português aqui...",
  "repertoire": {
    "entrance":       { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "penitential":    { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "gloria":         { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "acclamation":    { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "offertory":      { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "holy":           { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "communion":      { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "post_communion": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "recessional":    { "id": "uuid", "title": "...", "artist": "...", "justification": "..." }
  }
}
`

  console.log('🤖 Enviando prompt para o Gemini...')

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
    console.error('❌ Erro ao processar resposta do Gemini:', err)
    return NextResponse.json({ error: 'Failed to parse Gemini response' }, { status: 500 })
  }
}