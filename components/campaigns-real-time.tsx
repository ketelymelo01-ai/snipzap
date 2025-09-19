"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, MousePointer, DollarSign, TrendingUp, RefreshCw, Play, Pause, Target, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface Campaign {
  id: string
  name: string
  status: "active" | "paused" | "ended"
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  roas: number
  reach: number
  frequency: number
  lastUpdated: Date
}

// Mock data - em produção, isso viria da API do Facebook
const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Campanha Black Friday 2024",
    status: "active",
    budget: 5000,
    spent: 3250,
    impressions: 125000,
    clicks: 2500,
    conversions: 85,
    ctr: 2.0,
    cpc: 1.3,
    roas: 4.2,
    reach: 95000,
    frequency: 1.3,
    lastUpdated: new Date(),
  },
  {
    id: "2",
    name: "Promoção Natal - Produtos Premium",
    status: "active",
    budget: 3000,
    spent: 1850,
    impressions: 89000,
    clicks: 1780,
    conversions: 62,
    ctr: 2.0,
    cpc: 1.04,
    roas: 3.8,
    reach: 67000,
    frequency: 1.3,
    lastUpdated: new Date(),
  },
  {
    id: "3",
    name: "Remarketing - Carrinho Abandonado",
    status: "paused",
    budget: 1500,
    spent: 890,
    impressions: 45000,
    clicks: 950,
    conversions: 28,
    ctr: 2.1,
    cpc: 0.94,
    roas: 3.2,
    reach: 32000,
    frequency: 1.4,
    lastUpdated: new Date(),
  },
]

export function CampaignsRealTime() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Simula atualização em tempo real
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setCampaigns((prev) =>
        prev.map((campaign) => ({
          ...campaign,
          impressions: campaign.impressions + Math.floor(Math.random() * 100),
          clicks: campaign.clicks + Math.floor(Math.random() * 10),
          conversions: campaign.conversions + Math.floor(Math.random() * 2),
          spent: campaign.spent + Math.random() * 50,
          lastUpdated: new Date(),
        })),
      )
    }, 5000) // Atualiza a cada 5 segundos

    return () => clearInterval(interval)
  }, [autoRefresh])

  const refreshCampaigns = async () => {
    setIsRefreshing(true)
    // Simula chamada à API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setCampaigns((prev) =>
      prev.map((campaign) => ({
        ...campaign,
        lastUpdated: new Date(),
      })),
    )

    setIsRefreshing(false)
  }

  const toggleCampaignStatus = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((campaign) =>
        campaign.id === campaignId
          ? {
              ...campaign,
              status: campaign.status === "active" ? "paused" : "active",
            }
          : campaign,
      ),
    )
  }

  const getStatusColor = (status: Campaign["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "paused":
        return "bg-yellow-500"
      case "ended":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: Campaign["status"]) => {
    switch (status) {
      case "active":
        return "Ativa"
      case "paused":
        return "Pausada"
      case "ended":
        return "Finalizada"
      default:
        return "Desconhecido"
    }
  }

  const totalSpent = campaigns.reduce((sum, campaign) => sum + campaign.spent, 0)
  const totalConversions = campaigns.reduce((sum, campaign) => sum + campaign.conversions, 0)
  const totalImpressions = campaigns.reduce((sum, campaign) => sum + campaign.impressions, 0)
  const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.clicks, 0)

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={refreshCampaigns} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Atualizar
          </Button>

          <Button onClick={() => setAutoRefresh(!autoRefresh)} variant={autoRefresh ? "default" : "outline"} size="sm">
            {autoRefresh ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar Auto-Refresh
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Ativar Auto-Refresh
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Última atualização: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-effect border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Gasto Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Todas as campanhas</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-500" />
              Conversões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <p className="text-xs text-muted-foreground">Total de conversões</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-purple-500" />
              Impressões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total de impressões</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="h-4 w-4 text-orange-500" />
              Cliques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total de cliques</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de campanhas */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Campanhas Ativas</h2>

        {campaigns.map((campaign) => (
          <Card
            key={campaign.id}
            className="glass-effect border-primary/20 hover:border-primary/40 transition-all duration-300"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={cn("text-white", getStatusColor(campaign.status))}>
                    {getStatusText(campaign.status)}
                  </Badge>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                </div>

                <div className="flex items-center gap-2">
                  <Button onClick={() => toggleCampaignStatus(campaign.id)} variant="outline" size="sm">
                    {campaign.status === "active" ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Atualizado há {Math.floor((Date.now() - campaign.lastUpdated.getTime()) / 1000)} segundos
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Orçamento */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Orçamento Utilizado</span>
                  <span>
                    R$ {campaign.spent.toFixed(2)} / R$ {campaign.budget.toFixed(2)}
                  </span>
                </div>
                <Progress value={(campaign.spent / campaign.budget) * 100} className="h-2" />
              </div>

              {/* Métricas em grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="h-4 w-4 text-purple-500" />
                    <span className="text-xs font-medium">Impressões</span>
                  </div>
                  <div className="text-lg font-bold">{campaign.impressions.toLocaleString()}</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MousePointer className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium">Cliques</span>
                  </div>
                  <div className="text-lg font-bold">{campaign.clicks.toLocaleString()}</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-xs font-medium">Conversões</span>
                  </div>
                  <div className="text-lg font-bold">{campaign.conversions}</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-xs font-medium">ROAS</span>
                  </div>
                  <div className="text-lg font-bold">{campaign.roas.toFixed(1)}x</div>
                </div>
              </div>

              {/* Métricas adicionais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border/50">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">CTR</div>
                  <div className="font-semibold">{campaign.ctr.toFixed(2)}%</div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground">CPC</div>
                  <div className="font-semibold">R$ {campaign.cpc.toFixed(2)}</div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Alcance</div>
                  <div className="font-semibold">{campaign.reach.toLocaleString()}</div>
                </div>

                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Frequência</div>
                  <div className="font-semibold">{campaign.frequency.toFixed(1)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {autoRefresh && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Atualizando automaticamente a cada 5 segundos
        </div>
      )}
    </div>
  )
}
