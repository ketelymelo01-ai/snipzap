import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] API: Attempting to insert conversion data with service role...")

    const body = await request.json()
    const { event_name, event_value, facebook_event_id, pixel_id, metadata } = body

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase
      .from("conversions")
      .insert([
        {
          event_name,
          event_value,
          facebook_event_id,
          pixel_id,
          metadata,
          conversion_date: new Date().toISOString(),
        },
      ])
      .select()

    if (error) {
      console.log("[v0] API: Error inserting conversion:", error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] API: Conversion inserted successfully")
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.log("[v0] API: Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
