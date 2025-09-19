import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Create Supabase client with service role key to bypass RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const clientData = await request.json()

    console.log("[v0] API: Attempting to insert client data with service role...")

    const { data: existingClient, error: checkError } = await supabaseAdmin
      .from("clients")
      .select("id, email")
      .eq("email", clientData.email)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected when email doesn't exist
      console.error("[v0] API: Error checking existing email:", checkError.message)
      return NextResponse.json({ success: false, error: "Erro ao verificar email existente" }, { status: 500 })
    }

    if (existingClient) {
      console.log("[v0] API: Email already exists:", clientData.email)
      return NextResponse.json(
        {
          success: false,
          error: "Este email já está cadastrado no sistema",
          code: "EMAIL_EXISTS",
        },
        { status: 409 },
      )
    }

    // Insert client data using service role (bypasses RLS)
    const { data, error } = await supabaseAdmin.from("clients").insert([clientData]).select()

    if (error) {
      console.error("[v0] API: Insert error:", error.message)

      if (error.code === "23505" && error.message.includes("clients_email_key")) {
        return NextResponse.json(
          {
            success: false,
            error: "Este email já está cadastrado no sistema",
            code: "EMAIL_EXISTS",
          },
          { status: 409 },
        )
      }

      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    console.log("[v0] API: Client inserted successfully")
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] API: Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
