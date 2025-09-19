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

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get("account_id")

    if (!accountId) {
      return NextResponse.json({ error: "ID da conta é obrigatório" }, { status: 400 })
    }

    // Buscar campanhas do Facebook
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/campaigns?access_token=${facebookToken}&fields=id,name,status,objective,daily_budget,lifetime_budget&limit=50`,
    )

    if (!campaignsResponse.ok) {
      throw new Error("Erro ao buscar campanhas do Facebook")
    }

    const campaignsData = await campaignsResponse.json()

    if (campaignsData.error) {
      return NextResponse.json({ error: campaignsData.error.message }, { status: 400 })
    }

    // Buscar insights para cada campanha
    const campaignsWithInsights = await Promise.all(
      (campaignsData.data || []).map(async (campaign: any) => {
        try {
          const insightsResponse = await fetch(
            `https://graph.facebook.com/v18.0/${campaign.id}/insights?access_token=${facebookToken}&fields=impressions,clicks,spend,cpm,cpc,ctr,conversions,cost_per_conversion&date_preset=last_7d`,
          )

          if (insightsResponse.ok) {
            const insightsData = await insightsResponse.json()
            return {
              ...campaign,
              insights: insightsData.data?.[0] || {},
            }
          }

          return campaign
        } catch (error) {
          console.error(`Erro ao buscar insights para campanha ${campaign.id}:`, error)
          return campaign
        }
      }),
    )

    return NextResponse.json({
      campaigns: campaignsWithInsights,
      total: campaignsWithInsights.length,
    })
  } catch (error) {
    console.error("Erro na API de campanhas:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
