"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import type { Client } from "@/lib/types"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"

const COLORS = {
  whatsapp: "#25D366",
  facebook_ads: "#1877F2",
  organic: "#8B5CF6",
  referral: "#F59E0B",
  lead: "#6B7280",
  contacted: "#3B82F6",
  qualified: "#EAB308",
  converted: "#10B981",
  lost: "#EF4444",
}

export function VisualReports() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState("30d")
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)

  const checkTablesExist = async () => {
    try {
      console.log("[v0] Starting table check...")
      const supabase = createClient()

      const { error } = await supabase.from("clients").select("id").limit(0)

      if (error) {
        console.log("[v0] Table check failed:", error.message)
        if (
          error.message.includes("does not exist") ||
          error.message.includes("schema cache") ||
          error.message.includes("relation") ||
          error.message.includes("table")
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
      console.log("[v0] Table check error:", error)
      setTablesExist(false)
      return false
    }
  }

  const fetchData = async () => {
    try {
      const tablesAvailable = await checkTablesExist()
      if (!tablesAvailable) {
        console.log("[v0] Tables not found, skipping data fetch")
        setClients([])
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

      const { data, error } = await query.order("created_at", { ascending: true })

      if (error) {
        if (
          error.message.includes("does not exist") ||
          error.message.includes("schema cache") ||
          error.message.includes("relation") ||
          error.message.includes("table")
        ) {
          console.log("[v0] Table disappeared during query, updating state")
          setTablesExist(false)
          setClients([])
          return
        }
        throw error
      }

      setClients(data || [])
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("schema cache") ||
          error.message.includes("relation") ||
          error.message.includes("table"))
      ) {
        setTablesExist(false)
        setClients([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeFilter])

  const sourceData = clients.reduce(
    (acc, client) => {
      const source = client.source
      const existing = acc.find((item) => item.name === source)
      if (existing) {
        existing.value += 1
        existing.revenue += client.conversion_value
      } else {
        acc.push({
          name: source,
          value: 1,
          revenue: client.conversion_value,
          label: getSourceLabel(source),
        })
      }
      return acc
    },
    [] as Array<{ name: string; value: number; revenue: number; label: string }>,
  )

  const statusData = clients.reduce(
    (acc, client) => {
      const status = client.status
      const existing = acc.find((item) => item.name === status)
      if (existing) {
        existing.value += 1
      } else {
        acc.push({
          name: status,
          value: 1,
          label: getStatusLabel(status),
        })
      }
      return acc
    },
    [] as Array<{ name: string; value: number; label: string }>,
  )

  const timelineData = clients.reduce(
    (acc, client) => {
      const date = new Date(client.created_at).toLocaleDateString("pt-BR", {
        month: "short",
        day: "numeric",
      })
      const existing = acc.find((item) => item.date === date)
      if (existing) {
        existing.leads += 1
        if (client.status === "converted") {
          existing.conversions += 1
          existing.revenue += client.conversion_value
        }
      } else {
        acc.push({
          date,
          leads: 1,
          conversions: client.status === "converted" ? 1 : 0,
          revenue: client.status === "converted" ? client.conversion_value : 0,
        })
      }
      return acc
    },
    [] as Array<{ date: string; leads: number; conversions: number; revenue: number }>,
  )

  const revenueBySourceData = sourceData
    .filter((item) => item.revenue > 0)
    .map((item) => ({
      name: item.label,
      revenue: item.revenue,
    }))

  function getSourceLabel(source: string) {
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

  function getStatusLabel(status: string) {
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value)
  }

  if (tablesExist === false) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Relatórios Visuais</h2>
            <p className="text-gray-600">Gráficos e análises detalhadas dos dados de vendas</p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <div className="text-gray-500 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Banco de dados não configurado</h3>
              <p className="text-gray-600 mb-4">
                As tabelas do banco de dados ainda não foram criadas. Execute os scripts de configuração primeiro.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Tentar novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios Visuais</h2>
          <p className="text-gray-600">Gráficos e análises detalhadas dos dados de vendas</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
            <CardDescription>Distribuição dos leads por canal de aquisição</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, getSourceLabel(name as string)]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Quantidade de leads em cada estágio do funil</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads ao Longo do Tempo</CardTitle>
            <CardDescription>Evolução dos leads e conversões por data</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="leads" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area
                  type="monotone"
                  dataKey="conversions"
                  stackId="2"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita por Origem</CardTitle>
            <CardDescription>Valor total gerado por cada canal</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueBySourceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip formatter={(value) => [formatCurrency(value as number), "Receita"]} />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
          <CardDescription>Visualização do processo de conversão dos leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {statusData
              .sort((a, b) => {
                const order = ["lead", "contacted", "qualified", "converted"]
                return order.indexOf(a.name) - order.indexOf(b.name)
              })
              .map((status, index) => {
                const percentage = clients.length > 0 ? (status.value / clients.length) * 100 : 0
                return (
                  <div key={status.name} className="flex items-center space-x-4">
                    <div className="w-24 text-sm font-medium">{status.label}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-8 relative">
                        <div
                          className="h-8 rounded-full flex items-center justify-center text-white text-sm font-medium transition-all duration-500"
                          style={{
                            width: `${Math.max(percentage, 10)}%`,
                            backgroundColor: COLORS[status.name as keyof typeof COLORS],
                          }}
                        >
                          {status.value}
                        </div>
                      </div>
                    </div>
                    <div className="w-16 text-sm text-gray-600">{percentage.toFixed(1)}%</div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumo de Performance</CardTitle>
          <CardDescription>Principais métricas do período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{clients.length}</div>
              <div className="text-sm text-gray-600">Total de Leads</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {clients.filter((c) => c.status === "converted").length}
              </div>
              <div className="text-sm text-gray-600">Conversões</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {clients.length > 0
                  ? ((clients.filter((c) => c.status === "converted").length / clients.length) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Taxa de Conversão</div>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-lg">
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(clients.reduce((sum, client) => sum + client.conversion_value, 0))}
              </div>
              <div className="text-sm text-gray-600">Receita Total</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
