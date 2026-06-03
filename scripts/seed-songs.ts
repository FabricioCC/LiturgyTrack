import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as readline from 'readline'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve))
}

function printSongs(songs: any[]) {
  songs.forEach((s, i) => {
    console.log(`\n  ${i + 1}. ${s.title} — ${s.artist}`)
    console.log(`     ⏱  ${s.liturgical_time?.join(', ')}`)
    console.log(`     🎵 ${s.mass_part?.join(', ')}`)
    console.log(`     🏷  ${s.themes?.join(', ')}`)
  })
}

const LOTES = [
  {
    label: 'Lote 1 — Clássicas e Padre Zezinho',
    instrucao: 'Foque em músicas clássicas do repertório católico brasileiro, composições de Padre Zezinho, e hinos tradicionais.',
  },
  {
    label: 'Lote 2 — Comunidade Católica Shalom',
    instrucao: 'Foque em músicas da Comunidade Católica Shalom, Missionário Shalom.',
  },
  {
    label: 'Lote 3 — Walmir Alencar, Adoração e Vida, Eliana Ribeiro',
    instrucao: 'Foque em composições de Walmir Alencar, Adoração e Vida, Eliana Ribeiro.',
  },
  {
    label: 'Lote 4 — Frei Gilson, Hesed, Ir Kelly Patricia',
    instrucao: 'Foque em composições de Frei Gilson, Hesed, Ir Kelly Patricia.',
  },
  {
    label: 'Lote 5 — Toca de Assis, Amor e Adoração',
    instrucao: 'Foque em composições de Toca de Assis, Amor e Adoração.',
  },
  {
    label: 'Lote 6 — Clássicas e Padre Zezinho (parte 2)',
    instrucao: 'Foque em músicas clássicas do repertório católico brasileiro, composições de Padre Zezinho, e hinos tradicionais.',
  },
  {
    label: 'Lote 7 — Comunidade Católica Shalom (parte 2)',
    instrucao: 'Foque em músicas da Comunidade Católica Shalom, Missionário Shalom.',
  },
  {
    label: 'Lote 8 — Walmir Alencar, Adoração e Vida, Eliana Ribeiro (parte 2)',
    instrucao: 'Foque em composições de Walmir Alencar, Adoração e Vida, Eliana Ribeiro.',
  },
  {
    label: 'Lote 9 — Frei Gilson, Hesed, Ir Kelly Patricia (parte 2)',
    instrucao: 'Foque em composições de Frei Gilson, Hesed, Ir Kelly Patricia.',
  },
  {
    label: 'Lote 10 — Toca de Assis, Amor e Adoração (parte 2)',
    instrucao: 'Foque em composições de Toca de Assis, Amor e Adoração.',
  },
]

async function gerarLote(instrucao: string, jaInseridas: string[], instrucaoExtra: string = ''): Promise<any[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

  const prompt = `
Você é um especialista em música litúrgica católica brasileira.
${instrucao}
${instrucaoExtra ? `\nInstruções adicionais do revisor: ${instrucaoExtra}` : ''}

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
  let totalInserido = 0

  console.log('\n🎵 SEED INTERATIVO — LiturgiaTrack')
  console.log('━'.repeat(50))
  console.log('A cada lote você pode: aprovar, editar, regenerar ou pular.\n')

  for (const lote of LOTES) {
    console.log(`\n${'━'.repeat(50)}`)
    console.log(`📦 ${lote.label}`)
    console.log('━'.repeat(50))

    let instrucaoExtra = ''
    let songs: any[] = []
    let aprovado = false

    while (!aprovado) {
      console.log('\n⏳ Gerando músicas...')
      songs = await gerarLote(lote.instrucao, titulosJaInseridos, instrucaoExtra)

      const semDuplicatas = songs.filter(
        (s: any) => !titulosJaInseridos.includes(s.title?.toLowerCase())
      )
      songs = semDuplicatas

      console.log(`\n✅ ${songs.length} músicas geradas:\n`)
      printSongs(songs)

      console.log('\n' + '─'.repeat(50))
      console.log('O que deseja fazer?')
      console.log('  [enter]  — Aprovar e inserir no banco')
      console.log('  [r]      — Regenerar este lote')
      console.log('  [r texto]— Regenerar com instrução extra (ex: r foque mais em quaresma)')
      console.log('  [s]      — Pular este lote sem inserir')
      console.log('  [q]      — Encerrar o seed')
      console.log('─'.repeat(50))

      const resposta = await ask('\n> ')
      const cmd = resposta.trim().toLowerCase()

      if (cmd === '' || cmd === 'a') {
        // Aprovar
        const { error } = await supabase.from('songs').insert(
          songs.map((s: any) => ({
            ...s,
            source: 'seed',
            is_active: true,
            is_paroquial: false,
          }))
        )

        if (error) {
          console.error(`\n❌ Erro ao inserir no banco:`, error.message)
        } else {
          songs.forEach((s: any) => titulosJaInseridos.push(s.title?.toLowerCase()))
          totalInserido += songs.length
          console.log(`\n🎉 ${songs.length} músicas inseridas! Total acumulado: ${totalInserido}`)
        }
        aprovado = true

      } else if (cmd === 's') {
        console.log('\n⏭  Lote pulado.')
        aprovado = true

      } else if (cmd === 'q') {
        console.log(`\n✅ Seed encerrado. ${totalInserido} músicas inseridas no total.`)
        rl.close()
        return

      } else if (cmd.startsWith('r')) {
        instrucaoExtra = cmd.length > 1 ? resposta.trim().slice(2).trim() : ''
        if (instrucaoExtra) {
          console.log(`\n🔄 Regenerando com instrução extra: "${instrucaoExtra}"`)
        } else {
          console.log('\n🔄 Regenerando...')
        }
        // loop continua — gera de novo
      } else {
        console.log('\n⚠️  Comando não reconhecido. Tente novamente.')
      }
    }

    if (LOTES.indexOf(lote) < LOTES.length - 1) {
      console.log('\n⏳ Aguardando 3s antes do próximo lote...')
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  console.log(`\n${'━'.repeat(50)}`)
  console.log(`✅ SEED COMPLETO — ${totalInserido} músicas inseridas!`)
  console.log('━'.repeat(50))
  rl.close()
}

seedSongs()