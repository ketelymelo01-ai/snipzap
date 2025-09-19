import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST() {
  try {
    console.log("[v0] Setting up database tables...")

    // Create clients table
    const { error: clientsError } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.clients (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          whatsapp TEXT,
          source TEXT CHECK (source IN ('whatsapp', 'facebook_ads', 'organic', 'referral')) DEFAULT 'whatsapp',
          status TEXT CHECK (status IN ('lead', 'contacted', 'qualified', 'converted', 'lost')) DEFAULT 'lead',
          conversion_value DECIMAL(10,2) DEFAULT 0,
          utm_source TEXT,
          utm_medium TEXT,
          utm_campaign TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (clientsError) {
      console.error("[v0] Error creating clients table:", clientsError)
      return NextResponse.json({ success: false, error: clientsError.message }, { status: 500 })
    }

    // Create conversions table
    const { error: conversionsError } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS public.conversions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
          event_name TEXT NOT NULL,
          event_value DECIMAL(10,2) DEFAULT 0,
          facebook_event_id TEXT,
          pixel_id TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    if (conversionsError) {
      console.error("[v0] Error creating conversions table:", conversionsError)
      return NextResponse.json({ success: false, error: conversionsError.message }, { status: 500 })
    }

    // Create indexes
    const { error: indexError } = await supabaseAdmin.rpc("exec_sql", {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
        CREATE INDEX IF NOT EXISTS idx_clients_source ON public.clients(source);
        CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients(status);
        CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at);
        CREATE INDEX IF NOT EXISTS idx_conversions_client_id ON public.conversions(client_id);
        CREATE INDEX IF NOT EXISTS idx_conversions_event_name ON public.conversions(event_name);
      `,
    })

    if (indexError) {
      console.log("[v0] Warning: Could not create indexes (non-critical):", indexError.message)
    }

    console.log("[v0] Database setup completed successfully")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Setup database error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
