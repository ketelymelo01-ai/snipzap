"use client"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, Target, DollarSign } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

export function ProgressBar() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const goal = 100000 // Meta de R$ 100.000
  const progress = Math.min((totalRevenue / goal) * 100, 100)

  useEffect(() => {
    async function fetchRevenue() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const { data: conversions, error } = await supabase.from("conversions").select("event_value")

        if (error) {
          console.error("Error fetching conversions:", error)
          return
        }

        const total =
          conversions?.reduce((sum, conversion) => {
            return sum + (Number(conversion.event_value) || 0)
          }, 0) || 0

        setTotalRevenue(total)
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()
  }, [])

  return (
    <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Meta de Vendas</h3>
              <p className="text-sm text-muted-foreground">Objetivo: R$ 100.000</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-2xl font-bold text-primary">
              <DollarSign className="h-6 w-6" />
              {loading ? "..." : totalRevenue.toLocaleString("pt-BR")}
            </div>
            <div className="text-sm text-muted-foreground">{progress.toFixed(1)}% da meta</div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-3 bg-muted" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>R$ 0</span>
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Faltam R$ {(goal - totalRevenue).toLocaleString("pt-BR")}
            </span>
            <span>R$ 100.000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
