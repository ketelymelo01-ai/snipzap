"use client"
import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"

export function CompactProgressBar() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const goal = 100000 // Meta de R$ 100.000
  const progress = Math.min((totalRevenue / goal) * 100, 100)

  useEffect(() => {
    async function fetchRevenue() {
      try {
        console.log("[v0] Fetching revenue data...")
        setError(null)

        const supabase = createClient()

        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("conversion_value")
          .eq("status", "converted") // Apenas clientes convertidos

        if (clientsError) {
          console.error("[v0] Error fetching clients:", clientsError)
          throw clientsError
        }

        console.log("[v0] Clients raw data:", clientsData)

        const total = (clientsData || []).reduce((sum, client) => {
          const value = Number(client.conversion_value) || 0
          console.log("[v0] Client conversion_value:", client.conversion_value, "-> parsed:", value)
          return sum + value
        }, 0)

        console.log("[v0] Total revenue calculated:", total)
        setTotalRevenue(total)
      } catch (error) {
        console.error("[v0] Error fetching revenue:", error)
        setError(error instanceof Error ? error.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()

    const interval = setInterval(fetchRevenue, 10000)

    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`
    }
    return `R$ ${value}`
  }

  if (error && !loading) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-3 bg-red-500/10 backdrop-blur-sm rounded-full px-2 sm:px-4 py-1.5 sm:py-2 border border-red-500/20">
        <span className="text-red-500 text-xs sm:text-sm">Erro de conexão</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 bg-primary/10 backdrop-blur-sm rounded-full px-2 sm:px-4 py-1.5 sm:py-2 border border-primary/20">
      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
        <span className="text-primary">{loading ? "..." : formatCurrency(totalRevenue)}</span>
        <span className="text-muted-foreground hidden xs:inline">/</span>
        <span className="text-muted-foreground hidden xs:inline">{formatCurrency(goal)}</span>
      </div>
      <Progress value={progress} className="w-12 sm:w-20 h-1.5 sm:h-2 bg-muted/50" />
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary/20 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold text-primary">{progress.toFixed(0)}%</span>
      </div>
    </div>
  )
}
