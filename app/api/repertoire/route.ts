import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(req: NextRequest) {
  const { date, liturgy } = await req.json()

  if (!date || !liturgy) {
    return NextResponse.json({ error: 'Date and liturgy are required' }, { status: 400 })
  }

  console.log(`\n📅 Generating repertoire for ${date}`)
  console.log('📖 Liturgy received:', JSON.stringify(liturgy, null, 2))

  // Fetch active songs from catalog
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, title, artist, liturgical_time, mass_part, themes, is_paroquial')
    .eq('is_active', true)

  if (error) {
    console.error('❌ Failed to fetch songs:', error)
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
  }

  console.log(`🎵 Catalog loaded: ${songs.length} songs`)

  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

  const prompt = `
You are an expert in Brazilian Catholic liturgical music.
All your text responses MUST be in Brazilian Portuguese.

The liturgy for ${date} contains the following texts:
- Gospel: ${liturgy.evangelhoRef ?? ''} — ${liturgy.evangelho ?? ''}
- First Reading: ${liturgy.primeiraLeituraRef ?? ''} — ${liturgy.primeiraLeitura ?? ''}
- Psalm: ${liturgy.salmoRef ?? ''}
- Second Reading: ${liturgy.segundaLeituraRef ?? ''} — ${liturgy.segundaLeitura ?? ''}

Your task has two parts:

PART 1 — Summarize the liturgy:
Write a short summary (3 to 5 sentences) in Portuguese explaining the main theme and message of today's liturgy. This will help the musician understand the spiritual context of the Mass.

PART 2 — Choose songs:
Based on the liturgy texts and the catalog below, suggest one song for each part of the Mass.
Prefer songs marked with is_paroquial: true when available.
The "justification" field must be in Portuguese, explaining why the song fits the liturgy of the day.

CATALOG:
${JSON.stringify(songs)}

Return ONLY a JSON object in this exact format, no extra text:
{
  "liturgy_summary": "Resumo em português aqui...",
  "repertoire": {
    "entrance": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "penitential": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "gloria": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "acclamation": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "offertory": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "holy": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "communion": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "post_communion": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." },
    "recessional": { "id": "uuid", "title": "...", "artist": "...", "justification": "..." }
  }
}
`

  console.log('🤖 Sending prompt to Gemini...')

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  console.log('✅ Gemini raw response:')
  console.log(text)

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    console.log('\n📋 Liturgy Summary:')
    console.log(parsed.liturgy_summary)

    console.log('\n🎼 Suggested repertoire:')
    Object.entries(parsed.repertoire).forEach(([part, song]: [string, any]) => {
      console.log(`  ${part}: ${song.title} — ${song.artist}`)
      console.log(`    → ${song.justification}`)
    })

    return NextResponse.json(parsed)
  } catch (err) {
    console.error('❌ Failed to parse Gemini response:', err)
    console.error('Raw text was:', text)
    return NextResponse.json({ error: 'Failed to parse Gemini response' }, { status: 500 })
  }
}