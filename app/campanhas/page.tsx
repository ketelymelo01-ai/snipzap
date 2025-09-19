import { FacebookCampaignsConnector } from "@/components/facebook-campaigns-connector"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function CampanhasPage() {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Target className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Campanhas Facebook Ads</h1>
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Conecte sua conta do Facebook para visualizar campanhas reais
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>
        <FacebookCampaignsConnector />
      </div>
    </div>
  )
}
