import { FacebookAdsIntegration } from "@/components/facebook-ads-integration"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BarChart3, Users } from "lucide-react"
import { BackToHomeButton } from "@/components/back-to-home-button"

export default function FacebookAdsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Integração Facebook Ads</h1>
            <p className="text-gray-600">Configure o Facebook Pixel e acompanhe conversões</p>
          </div>
          <div className="flex gap-4">
            <BackToHomeButton />
            <Link href="/dashboard">
              <Button variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/clientes">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Ver Clientes
              </Button>
            </Link>
          </div>
        </div>
        <FacebookAdsIntegration />
      </div>
    </div>
  )
}
