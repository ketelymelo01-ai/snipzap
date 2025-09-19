import { ClientManagementTable } from "@/components/client-management-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { BackToHomeButton } from "@/components/back-to-home-button"

export default function ClientesPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gerenciamento de Clientes</h1>
            <p className="text-gray-600">Visualize e gerencie todos os seus clientes e leads</p>
          </div>
          <div className="flex gap-4">
            <BackToHomeButton />
            <Link href="/cadastro">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </Link>
          </div>
        </div>
        <ClientManagementTable />
      </div>
    </div>
  )
}
