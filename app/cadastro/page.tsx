import { ClientRegistrationForm } from "@/components/client-registration-form"
import { BackToHomeButton } from "@/components/back-to-home-button"

export default function CadastroPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Vendas</h1>
            <p className="text-gray-600">Sistema de gerenciamento de clientes e conversões</p>
          </div>
          <BackToHomeButton />
        </div>
        <ClientRegistrationForm />
      </div>
    </div>
  )
}
