import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') // format: YYYY-MM-DD

  if (!date) {
    return NextResponse.json({ error: 'Date is required' }, { status: 400 })
  }

  const [year, month, day] = date.split('-')

  // 1. Check cache in Supabase
  const { data: cached } = await supabase
    .from('repertoires')
    .select('liturgy_data')
    .eq('mass_date', date)
    .not('liturgy_data', 'is', null)
    .limit(1)
    .single()

  if (cached?.liturgy_data) {
    console.log('✅ Liturgy from cache')
    return NextResponse.json(cached.liturgy_data)
  }

  // 2. Fetch from external API
  const url = `https://liturgia.up.railway.app/v2/?dia=${day}&mes=${month}&ano=${year}`
  const res = await fetch(url)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch liturgy' }, { status: 502 })
  }

  const liturgy = await res.json()
  return NextResponse.json(liturgy)
}