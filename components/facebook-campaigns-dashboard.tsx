"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { RefreshCw, Search } from "lucide-react"

interface FacebookCampaign {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: string
  lifetime_budget?: string
  insights?: {
    impressions: string
    clicks: string
    spend: string
    cpm: string
    cpc: string
    ctr: string
    conversions?: string
    cost_per_conversion?: string
  }
}

const FacebookCampaignsDashboard = () => {
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadCampaigns()
    const interval = setInterval(loadCampaigns, 30000) // Auto refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadCampaigns = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: savedAccount } = await supabase
        .from("facebook_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (savedAccount) {
        await fetchCampaigns(savedAccount.account_id, savedAccount.access_token)
      }
    } catch (error) {
      console.error("Erro ao carregar campanhas:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async (accountId: string, accessToken: string) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,insights{impressions,clicks,spend,cpm,cpc,ctr,actions}&access_token=${accessToken}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Erro ao buscar campanhas")
      }

      const formattedCampaigns =
        data.data?.map((campaign: any) => ({
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          daily_budget: campaign.daily_budget,
          lifetime_budget: campaign.lifetime_budget,
          insights: campaign.insights?.data?.[0]
            ? {
                impressions: campaign.insights.data[0].impressions || "0",
                clicks: campaign.insights.data[0].clicks || "0",
                spend: campaign.insights.data[0].spend || "0",
                cpm: campaign.insights.data[0].cpm || "0",
                cpc: campaign.insights.data[0].cpc || "0",
                ctr: campaign.insights.data[0].ctr || "0",
                conversions:
                  campaign.insights.data[0].actions?.find(
                    (action: any) => action.action_type === "purchase" || action.action_type === "lead",
                  )?.value || "0",
              }
            : undefined,
        })) || []

      setCampaigns(formattedCampaigns)
      setLastUpdated(new Date())
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error)
      toast({
        title: "Erro ao buscar campanhas",
        description: "Não foi possível carregar suas campanhas do Facebook.",
        variant: "destructive",
      })
    }
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || campaign.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === "string" ? Number.parseFloat(value) : value
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue || 0)
  }

  const formatNumber = (value: string | number) => {
    const numValue = typeof value === "string" ? Number.parseInt(value) : value
    return numValue?.toLocaleString("pt-BR") || "0"
  }

  const calculateROAS = (spend: string, conversions: string, conversionValue = 50) => {
    const spendNum = Number.parseFloat(spend) || 0
    const conversionsNum = Number.parseInt(conversions) || 0
    const revenue = conversionsNum * conversionValue
    return spendNum > 0 ? (revenue / spendNum).toFixed(2) : "0.00"
  }

  const calculateMargin = (spend: string, conversions: string, conversionValue = 50) => {
    const spendNum = Number.parseFloat(spend) || 0
    const conversionsNum = Number.parseInt(conversions) || 0
    const revenue = conversionsNum * conversionValue
    const profit = revenue - spendNum
    return revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0"
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "text-green-500"
      case "paused":
        return "text-yellow-500"
      case "archived":
        return "text-gray-500"
      default:
        return "text-blue-500"
    }
  }

  const getValueColor = (value: number) => {
    if (value > 0) return "text-green-500"
    if (value < 0) return "text-red-500"
    return "text-gray-500"
  }

  const totals = campaigns.reduce(
    (acc, campaign) => {
      const insights = campaign.insights
      return {
        campaigns: acc.campaigns + 1,
        spend: acc.spend + (insights?.spend ? Number.parseFloat(insights.spend) : 0),
        impressions: acc.impressions + (insights?.impressions ? Number.parseInt(insights.impressions) : 0),
        clicks: acc.clicks + (insights?.clicks ? Number.parseInt(insights.clicks) : 0),
        conversions: acc.conversions + (insights?.conversions ? Number.parseInt(insights.conversions) : 0),
      }
    },
    { campaigns: 0, spend: 0, impressions: 0, clicks: 0, conversions: 0 },
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm">Campanhas</span>
          </div>
          <div className="flex items-center gap-2 text-blue-400">
            <span className="text-sm">CJs de {totals.campaigns} campanhas</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            {lastUpdated ? `Atualizado há ${Math.floor((Date.now() - lastUpdated.getTime()) / 60000)} minutos` : ""}
          </span>
          <Button onClick={loadCampaigns} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Atualizar"}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Nome do Conjunto</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Filtrar por nome"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Status do Conjunto</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">Qualquer</SelectItem>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="PAUSED">Pausado</SelectItem>
              <SelectItem value="ARCHIVED">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Período de Visualização</label>
          <Select defaultValue="today">
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="yesterday">Ontem</SelectItem>
              <SelectItem value="last7days">Últimos 7 dias</SelectItem>
              <SelectItem value="last30days">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-2 block">Conta de Anúncio</label>
          <Select defaultValue="all">
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">Qualquer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr className="text-left text-sm text-gray-300">
                <th className="p-4">STATUS</th>
                <th className="p-4">CONJUNTO</th>
                <th className="p-4">ORÇAMENTO</th>
                <th className="p-4">VENDAS</th>
                <th className="p-4">CPA</th>
                <th className="p-4">GASTOS</th>
                <th className="p-4">FATURAMENTO</th>
                <th className="p-4">LUCRO</th>
                <th className="p-4">ROAS</th>
                <th className="p-4">MARGEM</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((campaign) => {
                const insights = campaign.insights
                const spend = Number.parseFloat(insights?.spend || "0")
                const conversions = Number.parseInt(insights?.conversions || "0")
                const revenue = conversions * 50 // Assuming R$50 per conversion
                const profit = revenue - spend
                const roas = calculateROAS(insights?.spend || "0", insights?.conversions || "0")
                const margin = calculateMargin(insights?.spend || "0", insights?.conversions || "0")

                return (
                  <tr key={campaign.id} className="border-b border-slate-700 hover:bg-slate-750">
                    <td className="p-4">
                      <Switch checked={campaign.status === "ACTIVE"} className="data-[state=checked]:bg-blue-600" />
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">{campaign.name}</div>
                        <div className="text-sm text-gray-400">{campaign.objective}</div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">
                      {campaign.daily_budget
                        ? formatCurrency(campaign.daily_budget)
                        : campaign.lifetime_budget
                          ? formatCurrency(campaign.lifetime_budget)
                          : "N/A"}
                    </td>
                    <td className="p-4 text-white font-medium">{conversions}</td>
                    <td className="p-4 text-white">{conversions > 0 ? formatCurrency(spend / conversions) : "N/A"}</td>
                    <td className="p-4 text-white">{formatCurrency(spend)}</td>
                    <td className="p-4 text-green-500 font-medium">{formatCurrency(revenue)}</td>
                    <td className={`p-4 font-medium ${getValueColor(profit)}`}>
                      {profit > 0 ? "+" : ""}
                      {formatCurrency(profit)}
                    </td>
                    <td className={`p-4 font-medium ${getValueColor(Number.parseFloat(roas))}`}>{roas}</td>
                    <td className={`p-4 font-medium ${getValueColor(Number.parseFloat(margin))}`}>{margin}%</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-slate-700">
              <tr className="text-sm font-medium">
                <td className="p-4 text-gray-400">N/A</td>
                <td className="p-4 text-gray-400">N/A</td>
                <td className="p-4 text-white">{totals.campaigns} CONJUNTOS</td>
                <td className="p-4 text-white">{formatCurrency(totals.spend)}</td>
                <td className="p-4 text-white">{totals.conversions}</td>
                <td className="p-4 text-white">{formatCurrency(totals.spend)}</td>
                <td className="p-4 text-white">{formatCurrency(totals.spend)}</td>
                <td className="p-4 text-green-500">{formatCurrency(totals.conversions * 50)}</td>
                <td className="p-4 text-red-500">
                  -{formatCurrency(Math.abs(totals.conversions * 50 - totals.spend))}
                </td>
                <td className="p-4 text-white">0.35</td>
                <td className="p-4 text-red-500">-304.89%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}

export { FacebookCampaignsDashboard }
