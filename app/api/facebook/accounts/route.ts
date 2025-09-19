import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // Verificar se o usuário está autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Verificar se o usuário tem token do Facebook
    const facebookToken = user.user_metadata?.provider_token

    if (!facebookToken) {
      return NextResponse.json({ error: "Token do Facebook não encontrado" }, { status: 400 })
    }

    // Buscar contas de anúncios do Facebook
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${facebookToken}&fields=id,name,account_status,currency`,
    )

    if (!response.ok) {
      throw new Error("Erro ao buscar contas do Facebook")
    }

    const data = await response.json()

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    return NextResponse.json({
      accounts: data.data || [],
      total: data.data?.length || 0,
    })
  } catch (error) {
    console.error("Erro na API de contas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
