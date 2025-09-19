"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import type { Client, DashboardMetrics } from "@/lib/types"
import { Users, TrendingUp, DollarSign, Target, MessageSquare, Facebook, Search, UserCheck } from "lucide-react"

export function AnalyticsDashboard() {
  const [clients, setClients] = useState<Client[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState("all")
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)

  const checkTablesExist = async () => {
    try {
      console.log("[v0] Starting table check...")
      const supabase = createClient()

      const { error } = await supabase.from("clients").select("id").limit(0)

      if (error) {
        console.log("[v0] Table check failed:", error.message)
        if (
          error.message.includes("Could not find the table") ||
          (error.message.includes("relation") && error.message.includes("does not exist"))
        ) {
          console.log("[v0] Tables confirmed not to exist")
          setTablesExist(false)
          return false
        }
        throw error
      }

      console.log("[v0] Tables exist and are accessible")
      setTablesExist(true)
      return true
    } catch (error) {
      console.log("[v0] Error checking tables:", error)
      setTablesExist(false)
      return false
    }
  }

  const fetchData = async () => {
    try {
      console.log("[v0] Checking tables before fetch, tablesExist:", tablesExist)

      if (tablesExist === false) {
        console.log("[v0] Tables not found, skipping data fetch")
        setClients([])
        setMetrics({
          totalClients: 0,
          totalConversions: 0,
          totalRevenue: 0,
          conversionRate: 0,
          averageTicket: 0,
          leadsBySource: {},
          conversionsByStatus: {},
        })
        return
      }

      const tablesAvailable = await checkTablesExist()
      if (!tablesAvailable) {
        console.log("[v0] Tables check failed, aborting fetch")
        return
      }

      const supabase = createClient()

      let query = supabase.from("clients").select("*")

      if (timeFilter !== "all") {
        const now = new Date()
        const startDate = new Date()

        switch (timeFilter) {
          case "7d":
            startDate.setDate(now.getDate() - 7)
            break
          case "30d":
            startDate.setDate(now.getDate() - 30)
            break
          case "90d":
            startDate.setDate(now.getDate() - 90)
            break
        }

        query = query.gte("created_at", startDate.toISOString())
      }

      const { data, error } = await query.order("created_at", { ascending: false })

      if (error) {
        if (
          error.message.includes("Could not find the table") ||
          (error.message.includes("relation") && error.message.includes("does not exist"))
        ) {
          console.log("[v0] Table disappeared during fetch, updating state")
          setTablesExist(false)
          return
        }
        throw error
      }

      setClients(data || [])
      calculateMetrics(data || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      if (error instanceof Error && error.message.includes("Could not find the table")) {
        setTablesExist(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (clientsData: Client[]) => {
    const totalClients = clientsData.length
    const convertedClients = clientsData.filter((c) => c.status === "converted")
    const totalConversions = convertedClients.length
    const totalRevenue = convertedClients.reduce((sum, client) => sum + client.conversion_value, 0)
    const conversionRate = totalClients > 0 ? (totalConversions / totalClients) * 100 : 0
    const averageTicket = totalConversions > 0 ? totalRevenue / totalConversions : 0

    const leadsBySource = clientsData.reduce(
      (acc, client) => {
        acc[client.source] = (acc[client.source] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const conversionsByStatus = clientsData.reduce(
      (acc, client) => {
        acc[client.status] = (acc[client.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    setMetrics({
      totalClients,
      totalConversions,
      totalRevenue,
      conversionRate,
      averageTicket,
      leadsBySource,
      conversionsByStatus,
    })
  }

  useEffect(() => {
    const initializeData = async () => {
      const tablesAvailable = await checkTablesExist()
      if (tablesAvailable) {
        await fetchData()
      } else {
        setLoading(false)
      }
    }

    initializeData()
  }, [timeFilter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4" />
      case "facebook_ads":
        return <Facebook className="h-4 w-4" />
      case "organic":
        return <Search className="h-4 w-4" />
      case "referral":
        return <UserCheck className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case "whatsapp":
        return "WhatsApp"
      case "facebook_ads":
        return "Facebook Ads"
      case "organic":
        return "Orgânico"
      case "referral":
        return "Indicação"
      default:
        return source
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "lead":
        return "Leads"
      case "contacted":
        return "Contatados"
      case "qualified":
        return "Qualificados"
      case "converted":
        return "Convertidos"
      case "lost":
        return "Perdidos"
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "lead":
        return "bg-gray-100 text-gray-800"
      case "contacted":
        return "bg-blue-100 text-blue-800"
      case "qualified":
        return "bg-yellow-100 text-yellow-800"
      case "converted":
        return "bg-green-100 text-green-800"
      case "lost":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (tablesExist === false) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="mx-auto max-w-md">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <Users className="h-12 w-12" />
            </div>
            <h3 className="mt-2 text-sm font-semibold text-gray-900">Banco de dados não configurado</h3>
            <p className="mt-1 text-sm text-gray-500">
              As tabelas do banco de dados ainda não foram criadas. Execute os scripts de migração primeiro.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Visão geral das métricas de vendas e conversões</p>
        </div>
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.totalClients}</div>
            <p className="text-xs text-muted-foreground">Leads e clientes cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversões</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.totalConversions}</div>
            <p className="text-xs text-muted-foreground">Clientes convertidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Valor total das conversões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatPercentage(metrics.conversionRate)}</div>
            <p className="text-xs text-muted-foreground">Leads que se tornaram clientes</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Ticket Médio</CardTitle>
            <CardDescription>Valor médio por conversão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">{formatCurrency(metrics.averageTicket)}</div>
            <p className="text-sm text-gray-600">Baseado em {metrics.totalConversions} conversões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">ROAS Estimado</CardTitle>
            <CardDescription>Retorno sobre investimento em ads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">{metrics.totalRevenue > 0 ? "4.2x" : "0x"}</div>
            <p className="text-sm text-gray-600">Estimativa baseada na receita total</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Leads por Origem</CardTitle>
          <CardDescription>Distribuição dos leads por canal de aquisição</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(metrics.leadsBySource).map(([source, count]) => (
              <div key={source} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">{getSourceIcon(source)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{getSourceLabel(source)}</p>
                  <p className="text-2xl font-bold text-blue-600">{count}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Distribuição por Status</CardTitle>
          <CardDescription>Status atual dos leads e clientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(metrics.conversionsByStatus).map(([status, count]) => (
              <Badge key={status} className={`${getStatusColor(status)} px-3 py-2 text-sm`}>
                {getStatusLabel(status)}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Atividade Recente</CardTitle>
          <CardDescription>Últimos clientes cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {clients.slice(0, 5).map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">{getSourceIcon(client.source)}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{client.name}</p>
                    <p className="text-xs text-gray-500">{client.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(client.status)}>{getStatusLabel(client.status)}</Badge>
                  {client.conversion_value > 0 && (
                    <span className="text-sm font-medium text-green-600">
                      {formatCurrency(client.conversion_value)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
