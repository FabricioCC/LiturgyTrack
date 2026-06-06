import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Repertoire } from '../types/liturgy'
import { PART_LABELS } from '../types/liturgy'

export async function generatePDF(
  repertoire: Repertoire,
  liturgiaTitulo: string,
  liturgySummary: string,
  date: Date
) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = 210
  const marginX = 20
  const contentW = W - marginX * 2
  let y = 20

  const gold      = [180, 140,  60] as const
  const dark      = [ 30,  28,  25] as const
  const gray      = [120, 110, 100] as const
  const lightGray = [180, 170, 160] as const

  function checkPageBreak(needed: number) {
    if (y + needed > 277) { doc.addPage(); y = 20 }
  }

  function drawSectionLine() {
    doc.setDrawColor(...gold)
    doc.setLineWidth(0.3)
    doc.line(marginX, y, W - marginX, y)
    y += 5
  }

  // Header
  doc.setFillColor(25, 23, 20)
  doc.rect(0, 0, W, 42, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(...gold)
  doc.text('LiturgiaTrack', marginX, 18)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...lightGray)
  doc.text('Repertório Litúrgico', marginX, 25)
  const dateStr = format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  doc.setFontSize(10)
  doc.setTextColor(...gold)
  doc.text(dateStr, marginX, 33)
  y = 52

  // Liturgia do dia
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...gray)
  doc.text('LITURGIA DO DIA', marginX, y)
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...dark)
  const titleLines = doc.splitTextToSize(liturgiaTitulo, contentW)
  doc.text(titleLines, marginX, y)
  y += titleLines.length * 6 + 4

  // Resumo
  if (liturgySummary) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...gray)
    doc.text('RESUMO DA LITURGIA', marginX, y)
    y += 5
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(9)
    doc.setTextColor(80, 72, 64)
    const summaryLines = doc.splitTextToSize(liturgySummary, contentW)
    checkPageBreak(summaryLines.length * 5 + 10)
    doc.text(summaryLines, marginX, y)
    y += summaryLines.length * 5 + 8
  }

  drawSectionLine()

  // Repertório
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...gray)
  doc.text('REPERTÓRIO', marginX, y)
  y += 7

  for (const part of Object.keys(PART_LABELS) as (keyof Repertoire)[]) {
    const song = repertoire[part]
    if (!song) continue
    const { label } = PART_LABELS[part]
    const justLines = doc.splitTextToSize(song.justification ?? '', contentW - 4)
    checkPageBreak(6 + 7 + 5 + justLines.length * 4.5 + (song.letras_url ? 5 : 0) + 10)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(...gold)
    doc.text(label.toUpperCase(), marginX, y)
    y += 5

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...dark)
    const titleSongLines = doc.splitTextToSize(song.title, contentW)
    doc.text(titleSongLines, marginX, y)
    y += titleSongLines.length * 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...gray)
    doc.text(song.artist ?? '', marginX, y)
    y += 5

    if (song.justification) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(8)
      doc.setTextColor(130, 120, 110)
      doc.text(justLines, marginX + 2, y)
      y += justLines.length * 4.5 + 2
    }

    if (song.letras_url) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(160, 128, 60)
      doc.textWithLink('♪ Ver letra no Letras.mus.br', marginX + 2, y, { url: song.letras_url })
      y += 5
    }

    y += 5
    doc.setDrawColor(220, 215, 205)
    doc.setLineWidth(0.2)
    doc.line(marginX, y - 2, W - marginX, y - 2)
    y += 3
  }

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(...lightGray)
    doc.text(
      `LiturgiaTrack · ${format(date, 'dd/MM/yyyy')} · Página ${i} de ${pageCount}`,
      W / 2, 290, { align: 'center' }
    )
  }

  doc.save(`repertorio-${format(date, 'yyyy-MM-dd')}.pdf`)
}