import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Users } from "lucide-react"
import { BackToHomeButton } from "@/components/back-to-home-button"

export default function DashboardPage() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard de Vendas</h1>
            <p className="text-muted-foreground">Métricas, KPIs e análises de performance</p>
          </div>
          <div className="flex gap-4">
            <BackToHomeButton />
            <Link href="/clientes">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Ver Clientes
              </Button>
            </Link>
            <Link href="/cadastro">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </Link>
          </div>
        </div>
        <AnalyticsDashboard />
      </div>
    </div>
  )
}
