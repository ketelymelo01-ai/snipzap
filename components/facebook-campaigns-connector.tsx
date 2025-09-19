"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import {
  Facebook,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  ExternalLink,
} from "lucide-react"

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

interface FacebookAccount {
  id: string
  name: string
  account_status: number
  currency: string
}

const FacebookCampaignsConnector = () => {
  const { toast } = useToast()
  const [isConnected, setIsConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [campaigns, setCampaigns] = useState<FacebookCampaign[]>([])
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<string>("")
  const [accessToken, setAccessToken] = useState<string>("")
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: savedAccount } = await supabase
          .from("facebook_accounts")
          .select("*")
          .eq("user_id", user.id)
          .single()

        if (savedAccount) {
          setAccessToken(savedAccount.access_token)
          setSelectedAccount(savedAccount.account_id)
          setIsConnected(true)
          await fetchAdAccounts(savedAccount.access_token)
        }
      }
    }

    checkUser()
  }, [])

  const fetchAdAccounts = async (token?: string) => {
    const tokenToUse = token || accessToken
    if (!tokenToUse) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${tokenToUse}`,
      )
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Erro ao buscar contas")
      }

      const formattedAccounts =
        data.data?.map((account: any) => ({
          id: account.id,
          name: account.name,
          account_status: account.account_status,
          currency: account.currency,
        })) || []

      setAccounts(formattedAccounts)
      if (formattedAccounts.length > 0) {
        setSelectedAccount(formattedAccounts[0].id)
        await fetchCampaigns(formattedAccounts[0].id, tokenToUse)
      }
    } catch (error) {
      console.error("Erro ao buscar contas de anúncios:", error)
      toast({
        title: "Erro ao buscar contas",
        description: "Verifique se o token de acesso é válido e tem as permissões necessárias.",
        variant: "destructive",
      })
      localStorage.removeItem("facebook_access_token")
      setIsConnected(false)
      setAccessToken("")
    } finally {
      setLoading(false)
    }
  }

  const fetchCampaigns = async (accountId: string, token?: string) => {
    const tokenToUse = token || accessToken
    if (!tokenToUse) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${accountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget,insights{impressions,clicks,spend,cpm,cpc,ctr,actions}&access_token=${tokenToUse}`,
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

      toast({
        title: "Campanhas carregadas!",
        description: `${formattedCampaigns.length} campanhas encontradas.`,
      })
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error)
      toast({
        title: "Erro ao buscar campanhas",
        description: "Não foi possível carregar suas campanhas do Facebook.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const refreshCampaigns = () => {
    if (selectedAccount && accessToken) {
      fetchCampaigns(selectedAccount)
    }
  }

  const handleAccountChange = async (accountId: string) => {
    setSelectedAccount(accountId)
    fetchCampaigns(accountId)

    if (user && accessToken) {
      const selectedAccountData = accounts.find((acc) => acc.id === accountId)
      if (selectedAccountData) {
        await supabase.from("facebook_accounts").upsert({
          user_id: user.id,
          account_id: accountId,
          account_name: selectedAccountData.name,
          access_token: accessToken,
          updated_at: new Date().toISOString(),
        })
      }
    }
  }

  const connectWithToken = async () => {
    if (!accessToken.trim()) {
      toast({
        title: "Token necessário",
        description: "Por favor, insira um token de acesso válido.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${accessToken}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || "Token inválido")
      }

      setIsConnected(true)
      setShowTokenInput(false)
      await fetchAdAccounts(accessToken)

      toast({
        title: "Conectado com sucesso!",
        description: `Bem-vindo, ${data.name}!`,
      })
    } catch (error: any) {
      console.error("Erro ao conectar:", error)
      toast({
        title: "Erro ao conectar",
        description: error.message || "Token de acesso inválido.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const disconnect = async () => {
    if (user) {
      await supabase.from("facebook_accounts").delete().eq("user_id", user.id)
    }

    setIsConnected(false)
    setAccessToken("")
    setCampaigns([])
    setAccounts([])
    setSelectedAccount("")
    setShowTokenInput(false)

    toast({
      title: "Desconectado",
      description: "Sua conta foi desconectada com sucesso.",
    })
  }

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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "Ativa"
      case "paused":
        return "Pausada"
      case "archived":
        return "Arquivada"
      default:
        return status
    }
  }

  const calculateTotals = () => {
    return campaigns.reduce(
      (totals, campaign) => {
        const insights = campaign.insights
        return {
          impressions: totals.impressions + (insights?.impressions ? Number.parseInt(insights.impressions) : 0),
          clicks: totals.clicks + (insights?.clicks ? Number.parseInt(insights.clicks) : 0),
          spend: totals.spend + (insights?.spend ? Number.parseFloat(insights.spend) : 0),
          conversions: totals.conversions + (insights?.conversions ? Number.parseInt(insights.conversions) : 0),
        }
      },
      { impressions: 0, clicks: 0, spend: 0, conversions: 0 },
    )
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Conectar Facebook Ads
          </CardTitle>
          <CardDescription>Conecte sua conta do Facebook para visualizar suas campanhas em tempo real</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Para conectar sua conta:</p>
              <ol className="mt-2 list-decimal list-inside text-blue-700 space-y-1">
                <li>
                  Acesse o{" "}
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline inline-flex items-center gap-1"
                  >
                    Graph API Explorer <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>Selecione sua aplicação ou use a aplicação padrão</li>
                <li>Adicione as permissões: ads_read, ads_management</li>
                <li>Gere um token de acesso e cole abaixo</li>
              </ol>
            </div>
          </div>

          {!showTokenInput ? (
            <Button onClick={() => setShowTokenInput(true)} className="w-full bg-blue-600 hover:bg-blue-700">
              <Facebook className="mr-2 h-4 w-4" />
              Conectar com Token de Acesso
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="access-token">Token de Acesso do Facebook</Label>
                <Input
                  id="access-token"
                  type="password"
                  placeholder="Cole seu token de acesso aqui..."
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={connectWithToken} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  {loading ? "Conectando..." : "Conectar"}
                </Button>
                <Button onClick={() => setShowTokenInput(false)} variant="outline">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Campanhas Facebook Ads</h2>
          <p className="text-gray-600">Visualize suas campanhas em tempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="px-3 py-1">
            <CheckCircle className="h-3 w-3 mr-1" />
            Conectado
          </Badge>
          <Button onClick={refreshCampaigns} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={disconnect} size="sm" variant="outline">
            Desconectar
          </Button>
        </div>
      </div>

      {campaigns.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Impressões</CardTitle>
              <Eye className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatNumber(totals.impressions)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cliques</CardTitle>
              <MousePointer className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatNumber(totals.clicks)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(totals.spend)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversões</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatNumber(totals.conversions)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {accounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conta de Anúncios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {accounts.length > 1 ? (
                <div className="flex-1">
                  <Select value={selectedAccount} onValueChange={handleAccountChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma conta" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name} ({account.currency})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <p className="font-medium">{accounts[0]?.name}</p>
                  <p className="text-sm text-gray-600">ID: {selectedAccount}</p>
                </div>
              )}
              <Badge variant="outline">{accounts.find((acc) => acc.id === selectedAccount)?.currency || "BRL"}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {campaigns.length > 0 ? (
        <div className="grid gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription>
                      Objetivo: {campaign.objective} • ID: {campaign.id}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(campaign.status)}>{getStatusText(campaign.status)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Impressões</p>
                    <p className="font-bold text-blue-600">
                      {campaign.insights?.impressions ? formatNumber(campaign.insights.impressions) : "0"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <MousePointer className="h-5 w-5 text-green-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Cliques</p>
                    <p className="font-bold text-green-600">
                      {campaign.insights?.clicks ? formatNumber(campaign.insights.clicks) : "0"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <DollarSign className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">Gasto</p>
                    <p className="font-bold text-purple-600">
                      {campaign.insights?.spend ? formatCurrency(campaign.insights.spend) : "R$ 0,00"}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                    <p className="text-sm text-gray-600">CTR</p>
                    <p className="font-bold text-orange-600">
                      {campaign.insights?.ctr ? `${Number.parseFloat(campaign.insights.ctr).toFixed(2)}%` : "0%"}
                    </p>
                  </div>
                </div>

                {campaign.insights && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">CPM: </span>
                      <span className="font-medium">
                        {campaign.insights.cpm ? formatCurrency(campaign.insights.cpm) : "R$ 0,00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">CPC: </span>
                      <span className="font-medium">
                        {campaign.insights.cpc ? formatCurrency(campaign.insights.cpc) : "R$ 0,00"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Conversões: </span>
                      <span className="font-medium">{campaign.insights.conversions || "0"}</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Orçamento:</span>
                    <span className="font-medium">
                      {campaign.daily_budget
                        ? `${formatCurrency(campaign.daily_budget)}/dia`
                        : campaign.lifetime_budget
                          ? `${formatCurrency(campaign.lifetime_budget)} total`
                          : "Não definido"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Facebook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{loading ? "Carregando campanhas..." : "Nenhuma campanha encontrada"}</p>
            {!loading && (
              <Button onClick={refreshCampaigns} className="mt-4 bg-transparent" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { FacebookCampaignsConnector }
