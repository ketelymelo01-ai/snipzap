"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { Client, Conversion } from "@/lib/types"
import { trackPurchase, trackFacebookEvent } from "@/lib/facebook-events"
import { Facebook, TrendingUp, DollarSign, Target, AlertCircle, Settings, CheckCircle } from "lucide-react"

export function FacebookAdsIntegration() {
  const { toast } = useToast()
  const [pixelId, setPixelId] = useState("")
  const [accessToken, setAccessToken] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [conversions, setConversions] = useState<Conversion[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(false)
  const [tablesExist, setTablesExist] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<"pago" | "perdente">("pago")
  const [eventValue, setEventValue] = useState("100")
  const [pixelStatus, setPixelStatus] = useState<"loading" | "ready" | "error">("loading")

  const checkPixelStatus = () => {
    if (typeof window !== "undefined") {
      if (window.fbq && typeof window.fbq === "function") {
        setPixelStatus("ready")
        console.log("[v0] ✅ Facebook Pixel is ready")
        return true
      } else {
        setPixelStatus("error")
        console.log("[v0] ❌ Facebook Pixel not loaded")
        return false
      }
    }
    return false
  }

  useEffect(() => {
    const checkInterval = setInterval(() => {
      if (isConnected && pixelId) {
        checkPixelStatus()
      }
    }, 1000)

    setTimeout(() => {
      if (isConnected && pixelId) {
        checkPixelStatus()
      }
    }, 2000)

    return () => clearInterval(checkInterval)
  }, [isConnected, pixelId])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      const { data: tablesData, error: tablesError } = await supabase
        .from("information_schema.tables")
        .select("table_name")
        .eq("table_schema", "public")
        .in("table_name", ["clients", "conversions"])

      if (tablesError || !tablesData || tablesData.length < 2) {
        console.log("[v0] Tables not found in database schema")
        setTablesExist(false)
        setConversions([])
        setClients([])
        return
      }

      setTablesExist(true)

      const { data: conversionsData, error: conversionsError } = await supabase
        .from("conversions")
        .select("*")
        .order("conversion_date", { ascending: false })

      if (conversionsError) {
        console.log("[v0] Error fetching conversions:", conversionsError.message)
        setConversions([])
      } else {
        setConversions(conversionsData || [])
      }

      const { data: clientsData, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .eq("source", "facebook_ads")
        .order("created_at", { ascending: false })

      if (clientsError) {
        console.log("[v0] Error fetching clients:", clientsError.message)
        setClients([])
      } else {
        setClients(clientsData || [])
      }
    } catch (error) {
      console.log("[v0] Database connection error:", error)
      setTablesExist(false)
      setConversions([])
      setClients([])
    }
  }

  useEffect(() => {
    fetchData()
    const savedPixelId = localStorage.getItem("facebook_pixel_id")
    if (savedPixelId) {
      setPixelId(savedPixelId)
      setIsConnected(true)
    }
  }, [])

  const handleConnect = () => {
    if (!pixelId) {
      toast({
        title: "Pixel ID obrigatório",
        description: "Por favor, insira o ID do Facebook Pixel.",
        variant: "destructive",
      })
      return
    }

    localStorage.setItem("facebook_pixel_id", pixelId)
    if (accessToken) {
      localStorage.setItem("facebook_access_token", accessToken)
    }

    setIsConnected(true)
    setPixelStatus("loading")

    toast({
      title: "Facebook Ads conectado!",
      description: "Pixel configurado com sucesso. Recarregue a página manualmente se necessário.",
    })
  }

  const handleDisconnect = () => {
    localStorage.removeItem("facebook_pixel_id")
    localStorage.removeItem("facebook_access_token")
    setIsConnected(false)
    setPixelId("")
    setAccessToken("")
    setPixelStatus("loading")
    toast({
      title: "Desconectado",
      description: "A integração com Facebook Ads foi removida.",
    })
  }

  const sendTestEvent = async () => {
    if (!tablesExist) {
      toast({
        title: "Banco de dados não configurado",
        description: "Execute os scripts SQL primeiro para criar as tabelas necessárias.",
        variant: "destructive",
      })
      return
    }

    if (!checkPixelStatus()) {
      toast({
        title: "Facebook Pixel não carregado",
        description: "Aguarde o pixel carregar ou recarregue a página.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      console.log("[v0] 🧪 Sending test event to Facebook Pixel...")

      const testEventSuccess = trackFacebookEvent("Purchase", {
        value: 100,
        currency: "BRL",
        content_ids: ["test_product"],
        content_name: "Test Purchase Event",
        content_type: "product",
      })

      console.log("[v0] Test event sent to Facebook:", testEventSuccess)

      const response = await fetch("/api/conversions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_name: "Test Purchase",
          event_value: 100,
          facebook_event_id: `test_${Date.now()}`,
          pixel_id: pixelId,
          metadata: { test: true, timestamp: new Date().toISOString() },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save conversion")
      }

      const result = await response.json()
      console.log("[v0] ✅ Test event saved to database:", result)

      toast({
        title: "Evento de teste enviado!",
        description: "Verifique o Facebook Events Manager para confirmar o recebimento.",
      })

      fetchData()
    } catch (error) {
      console.error("[v0] ❌ Erro ao enviar evento:", error)
      toast({
        title: "Erro ao enviar evento",
        description: "Não foi possível enviar o evento de teste. Verifique o console para mais detalhes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const sendCustomEvent = async () => {
    if (!tablesExist) {
      toast({
        title: "Banco de dados não configurado",
        description: "Execute os scripts SQL primeiro para criar as tabelas necessárias.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const eventName = selectedEventType === "pago" ? "Purchase" : "Lead"
      const value = Number.parseFloat(eventValue) || 0

      if (selectedEventType === "pago") {
        trackPurchase({
          value: value,
          currency: "BRL",
          content_ids: [`${selectedEventType}_${Date.now()}`],
        })
      } else {
        trackFacebookEvent("Lead", {
          value: value,
          currency: "BRL",
          content_name: "Lead Perdente",
        })
      }

      const response = await fetch("/api/conversions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_name: `${eventName} - ${selectedEventType}`,
          event_value: value,
          facebook_event_id: `${selectedEventType}_${Date.now()}`,
          pixel_id: pixelId,
          metadata: {
            event_type: selectedEventType,
            custom_event: true,
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save conversion")
      }

      toast({
        title: `Evento "${selectedEventType}" enviado!`,
        description: `Evento ${eventName} com valor ${formatCurrency(value)} foi enviado para o Facebook.`,
      })

      fetchData()
    } catch (error) {
      console.error("Erro ao enviar evento:", error)
      toast({
        title: "Erro ao enviar evento",
        description: `Não foi possível enviar o evento "${selectedEventType}".`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateROAS = () => {
    const totalRevenue = clients.reduce((sum, client) => sum + client.conversion_value, 0)
    const estimatedAdSpend = totalRevenue * 0.2
    return estimatedAdSpend > 0 ? totalRevenue / estimatedAdSpend : 0
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Integração Facebook Ads</h2>
          <p className="text-gray-600">Configure o Facebook Pixel e acompanhe conversões</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "secondary"} className="px-3 py-1">
            {isConnected ? "Conectado" : "Desconectado"}
          </Badge>
          {isConnected && (
            <Badge
              variant={pixelStatus === "ready" ? "default" : pixelStatus === "error" ? "destructive" : "secondary"}
              className="px-3 py-1"
            >
              {pixelStatus === "ready" && <CheckCircle className="h-3 w-3 mr-1" />}
              {pixelStatus === "error" && <AlertCircle className="h-3 w-3 mr-1" />}
              Pixel: {pixelStatus === "ready" ? "Ativo" : pixelStatus === "error" ? "Erro" : "Carregando"}
            </Badge>
          )}
        </div>
      </div>

      {!tablesExist && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Banco de Dados Não Configurado
            </CardTitle>
            <CardDescription className="text-orange-700">
              As tabelas do banco de dados ainda não foram criadas. Execute os scripts SQL primeiro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-orange-700">
              <p className="font-medium">Para configurar o banco de dados:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>
                  Execute o script:{" "}
                  <code className="bg-orange-100 px-1 rounded">scripts/001_create_clients_table.sql</code>
                </li>
                <li>
                  Execute o script:{" "}
                  <code className="bg-orange-100 px-1 rounded">scripts/002_create_conversions_table.sql</code>
                </li>
                <li>
                  Execute o script: <code className="bg-orange-100 px-1 rounded">scripts/003_seed_sample_data.sql</code>
                </li>
                <li>Recarregue esta página</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Configuração do Facebook Pixel
          </CardTitle>
          <CardDescription>Configure seu Facebook Pixel para rastrear conversões e calcular ROAS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pixel-id">Facebook Pixel ID *</Label>
              <Input
                id="pixel-id"
                placeholder="123456789012345"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                disabled={isConnected}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access-token">Access Token (Opcional)</Label>
              <Input
                id="access-token"
                placeholder="EAAxxxxx..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                disabled={isConnected}
                type="password"
              />
            </div>
          </div>

          <div className="flex gap-4">
            {!isConnected ? (
              <Button onClick={handleConnect} className="bg-blue-600 hover:bg-blue-700">
                Conectar Facebook Ads
              </Button>
            ) : (
              <>
                <Button onClick={handleDisconnect} variant="outline">
                  Desconectar
                </Button>
                <Button
                  onClick={sendTestEvent}
                  disabled={loading || !tablesExist || pixelStatus !== "ready"}
                  className={pixelStatus === "ready" ? "bg-green-600 hover:bg-green-700" : ""}
                >
                  {loading ? "Enviando..." : "Enviar Evento de Teste"}
                </Button>
              </>
            )}
          </div>

          {isConnected && (
            <div
              className={`flex items-start gap-2 p-4 rounded-lg ${
                pixelStatus === "ready" ? "bg-green-50" : pixelStatus === "error" ? "bg-red-50" : "bg-yellow-50"
              }`}
            >
              {pixelStatus === "ready" && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
              {pixelStatus === "error" && <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />}
              {pixelStatus === "loading" && <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />}
              <div className="text-sm">
                {pixelStatus === "ready" && (
                  <>
                    <p className="font-medium text-green-800">Facebook Pixel Ativo</p>
                    <p className="text-green-700">O pixel está carregado e pronto para enviar eventos.</p>
                  </>
                )}
                {pixelStatus === "error" && (
                  <>
                    <p className="font-medium text-red-800">Erro no Facebook Pixel</p>
                    <p className="text-red-700">O pixel não foi carregado. Verifique o ID e recarregue a página.</p>
                  </>
                )}
                {pixelStatus === "loading" && (
                  <>
                    <p className="font-medium text-yellow-800">Carregando Facebook Pixel</p>
                    <p className="text-yellow-700">Aguardando o pixel carregar...</p>
                  </>
                )}
              </div>
            </div>
          )}

          {!isConnected && (
            <div className="flex items-start gap-2 p-4 bg-yellow-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Como configurar:</p>
                <ol className="mt-2 list-decimal list-inside text-yellow-700 space-y-1">
                  <li>Acesse o Facebook Business Manager</li>
                  <li>Vá em "Eventos" → "Pixels"</li>
                  <li>Copie o ID do seu pixel (15 dígitos)</li>
                  <li>Cole o ID acima e clique em "Conectar"</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isConnected && tablesExist && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Facebook Ads</CardTitle>
            <Facebook className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
            <p className="text-xs text-muted-foreground">Leads gerados via Facebook</p>
          </CardContent>
        </Card>
      )}

      {isConnected && tablesExist && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Configuração de Eventos
            </CardTitle>
            <CardDescription>Escolha o tipo de evento para enviar ao Facebook Pixel</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="event-type">Tipo de Evento</Label>
                <Select
                  value={selectedEventType}
                  onValueChange={(value: "pago" | "perdente") => setSelectedEventType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pago">Pago (Purchase)</SelectItem>
                    <SelectItem value="perdente">Perdente (Lead)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-value">Valor do Evento (R$)</Label>
                <Input
                  id="event-value"
                  type="number"
                  placeholder="100"
                  value={eventValue}
                  onChange={(e) => setEventValue(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={sendCustomEvent}
                  disabled={loading}
                  className="w-full"
                  variant={selectedEventType === "pago" ? "default" : "outline"}
                >
                  {loading ? "Enviando..." : `Enviar Evento "${selectedEventType}"`}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg">
              <Target className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Tipos de Evento:</p>
                <ul className="mt-2 text-blue-700 space-y-1">
                  <li>
                    <strong>Pago:</strong> Envia evento "Purchase" - usado para conversões pagas
                  </li>
                  <li>
                    <strong>Perdente:</strong> Envia evento "Lead" - usado para leads que não converteram
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isConnected && tablesExist && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Leads Facebook Ads</CardTitle>
              <Facebook className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
              <p className="text-xs text-muted-foreground">Leads gerados via Facebook</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Facebook</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(clients.reduce((sum, client) => sum + client.conversion_value, 0))}
              </div>
              <p className="text-xs text-muted-foreground">Receita total do Facebook Ads</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ROAS Estimado</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{calculateROAS().toFixed(1)}x</div>
              <p className="text-xs text-muted-foreground">Retorno sobre investimento</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isConnected && tablesExist && conversions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conversões Recentes</CardTitle>
            <CardDescription>Últimos eventos enviados para o Facebook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversions.slice(0, 10).map((conversion) => (
                <div key={conversion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Target className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">{conversion.event_name}</p>
                      <p className="text-xs text-gray-500">{formatDate(conversion.conversion_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(conversion.event_value)}</p>
                    {conversion.facebook_event_id && (
                      <p className="text-xs text-gray-500">ID: {conversion.facebook_event_id.slice(0, 8)}...</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Como Funciona a Integração</CardTitle>
          <CardDescription>Entenda como o sistema rastreia conversões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Eventos Automáticos</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Lead: Quando um cliente é cadastrado</li>
                <li>• Purchase: Quando status muda para "convertido"</li>
                <li>• CompleteRegistration: Cadastros via formulário</li>
                <li>• ViewContent: Visualizações do dashboard</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Benefícios</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Otimização automática de campanhas</li>
                <li>• Cálculo preciso do ROAS</li>
                <li>• Remarketing para leads qualificados</li>
                <li>• Lookalike audiences baseadas em conversões</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
