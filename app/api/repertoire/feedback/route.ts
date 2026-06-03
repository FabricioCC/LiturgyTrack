import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

type FeedbackEntry = {
  mass_part: string
  suggested_song_id: string
  chosen_song_id: string
  was_accepted: boolean
}

// Called when the user confirms or edits the generated repertoire
export async function POST(req: NextRequest) {
  const { user_id, feedbacks } = await req.json()

  if (!feedbacks || !Array.isArray(feedbacks) || feedbacks.length === 0) {
    return NextResponse.json({ error: 'feedbacks array is required' }, { status: 400 })
  }

  const rows = feedbacks.map((f: FeedbackEntry) => ({
    user_id: user_id ?? null,
    mass_part: f.mass_part,
    suggested_song_id: f.suggested_song_id,
    chosen_song_id: f.chosen_song_id,
    was_accepted: f.was_accepted,
  }))

  const { error } = await supabase.from('repertoire_feedback').insert(rows)

  if (error) {
    console.error('❌ Failed to save feedback:', error)
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}