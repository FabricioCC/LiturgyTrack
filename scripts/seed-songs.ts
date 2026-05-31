import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const LOTES = [
  {
    label: 'Lote 1 — Clássicas e Padre Zezinho',
    instrucao: 'Foque em músicas clássicas do repertório católico brasileiro, composições de Padre Zezinho, e hinos tradicionais.',
  },
  {
    label: 'Lote 2 — Comunidade Católica Shalom',
    instrucao: 'Foque em músicas da Comunidade Católica Shalom, Missionário Shalom'
  },
  {
    label: 'Lote 3 — Walmir Alencar, Adoração e Vida, Eliana Ribeiro',
    instrucao: 'Foque em composições de Walmir Alencar, Adoração e Vida, Eliana RibeirO.',
  },
    {
    label: 'Lote 4 — Frei Gilson, Hesed, Ir Kelly Patricia',
    instrucao: 'Foque em composições de Frei Gilson, Hesed, Ir Kelly Patricia',
  },    {
    label: 'Lote 5 — Toca de Assis, Amor e Adoração',
    instrucao: 'Foque em composições de Toca de Assis, Amor e Adoração',
  },
    {
    label: 'Lote 6 — Clássicas e Padre Zezinho',
    instrucao: 'Foque em músicas clássicas do repertório católico brasileiro, composições de Padre Zezinho, e hinos tradicionais.',
  },
  {
    label: 'Lote 7 — Comunidade Católica Shalom',
    instrucao: 'Foque em músicas da Comunidade Católica Shalom, Missionário Shalom'
  },
  {
    label: 'Lote 8 — Walmir Alencar, Adoração e Vida, Eliana Ribeiro',
    instrucao: 'Foque em composições de Walmir Alencar, Adoração e Vida, Eliana RibeirO.',
  },
    {
    label: 'Lote 9 — Frei Gilson, Hesed, Ir Kelly Patricia',
    instrucao: 'Foque em composições de Frei Gilson, Hesed, Ir Kelly Patricia',
  },    {
    label: 'Lote 10 — Toca de Assis, Amor e Adoração',
    instrucao: 'Foque em composições de Toca de Assis, Amor e Adoração',
  },
]

async function gerarLote(instrucao: string, jaInseridas: string[]): Promise<any[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

  const prompt = `
Você é um especialista em música litúrgica católica brasileira.
${instrucao}

Liste 20 músicas. NÃO inclua nenhuma dessas que já foram inseridas:
${jaInseridas.length > 0 ? jaInseridas.join(', ') : '(nenhuma ainda)'}

Para cada música, retorne um objeto JSON com exatamente estes campos:
- title: string com o nome da música
- artist: string com o compositor ou intérprete principal
- liturgical_time: array com tempos litúrgicos adequados.
  Valores possíveis: "comum", "advento", "natal", "quaresma", "pascal"
- mass_part: array com partes da missa onde é usada.
  Valores possíveis: "entrada", "ato_penitencial", "gloria", "salmo", "ofertorio", "santo", "cordeiro", "comunhao", "final"
- themes: array com 2 a 4 temas teológicos em português

Retorne APENAS um array JSON válido com os 20 objetos, sem texto antes ou depois, sem markdown, sem blocos de código.
`

  const result = await model.generateContent(prompt)
  const text = result.response.text()

  try {
    return JSON.parse(text)
  } catch {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  }
}

async function seedSongs() {
  const titulosJaInseridos: string[] = []

  for (const lote of LOTES) {
    console.log(`\n🎵 Gerando ${lote.label} (com letras)...`)

    const songs = await gerarLote(lote.instrucao, titulosJaInseridos)

    const semDuplicatas = songs.filter(
      (s: any) => !titulosJaInseridos.includes(s.title?.toLowerCase())
    )

    const comLetra = semDuplicatas.filter((s: any) => s.lyrics).length
    console.log(`✅ ${semDuplicatas.length} músicas | 🎶 ${comLetra} com letra | ⚠️  ${semDuplicatas.length - comLetra} sem letra`)

    const { error } = await supabase.from('songs').insert(
      semDuplicatas.map((s: any) => ({
        ...s,
        source: 'seed',
        is_active: true,
        is_paroquial: false,
      }))
    )

    if (error) {
      console.error(`❌ Erro no ${lote.label}:`, error)
    } else {
      semDuplicatas.forEach((s: any) => titulosJaInseridos.push(s.title?.toLowerCase()))
      console.log(`🎉 ${lote.label} inserido! Total acumulado: ${titulosJaInseridos.length}`)
    }

    console.log('⏳ Aguardando 3s antes do próximo lote...')
    await new Promise(r => setTimeout(r, 3000))
  }

  console.log(`\n✅ SEED COMPLETO — ${titulosJaInseridos.length} músicas inseridas!`)
}

seedSongs()