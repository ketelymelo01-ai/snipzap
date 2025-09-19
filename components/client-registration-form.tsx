"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { trackPurchase, trackLead } from "@/lib/facebook-events"
import { AlertCircle, Play } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ClientFormData {
  name: string
  email: string
  phone: string
  whatsapp: string
  source: "whatsapp" | "facebook_ads" | "organic" | "referral"
  status: "lead" | "contacted" | "qualified" | "converted" | "lost"
  conversion_value: string
  utm_source: string
  utm_medium: string
  utm_campaign: string
  notes: string
}

export function ClientRegistrationForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [tablesExist, setTablesExist] = useState<boolean | null>(null)
  const [isCreatingTables, setIsCreatingTables] = useState(false)
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    source: "whatsapp",
    status: "lead",
    conversion_value: "0",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    notes: "",
  })

  const checkTablesExist = async () => {
    try {
      console.log("[v0] Starting table check...")
      const supabase = createClient()

      const { error } = await supabase.from("clients").select("id").limit(1)

      if (error) {
        console.log("[v0] Table check failed:", error.message)
        if (
          (error.message.includes("relation") && error.message.includes("does not exist")) ||
          (error.message.includes("table") && error.message.includes("not found")) ||
          error.code === "42P01" // PostgreSQL error code for undefined table
        ) {
          console.log("[v0] Tables confirmed not to exist")
          setTablesExist(false)
          return
        }
        console.log("[v0] Tables exist but may have permission issues, allowing form")
        setTablesExist(true)
        return
      }

      console.log("[v0] Tables exist and accessible")
      setTablesExist(true)
    } catch (error) {
      console.error("[v0] Error checking tables:", error)
      console.log("[v0] Unexpected error, assuming tables exist")
      setTablesExist(true)
    }
  }

  const setupDatabase = async () => {
    setIsCreatingTables(true)
    try {
      console.log("[v0] Setting up database...")

      // Execute the database setup script
      const response = await fetch("/api/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to setup database")
      }

      const result = await response.json()

      if (result.success) {
        console.log("[v0] Database setup successful")
        setTablesExist(true)
        toast({
          title: "Banco de dados configurado!",
          description: "As tabelas foram criadas com sucesso.",
        })
      } else {
        throw new Error(result.error || "Unknown error")
      }
    } catch (error) {
      console.error("[v0] Error setting up database:", error)
      toast({
        title: "Erro ao configurar banco",
        description: "Não foi possível criar as tabelas automaticamente. Execute o script SQL manualmente.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingTables(false)
    }
  }

  useEffect(() => {
    checkTablesExist()
  }, [])

  const handleInputChange = (field: keyof ClientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log("[v0] Form submitted, tablesExist:", tablesExist)

    if (tablesExist !== true) {
      console.log("[v0] Tables don't exist, blocking submission")
      toast({
        title: "Banco de dados não configurado",
        description: "Configure o banco de dados primeiro clicando no botão 'Configurar Banco'.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      console.log("[v0] Attempting to insert client data via API...")

      const clientData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        whatsapp: formData.whatsapp || null,
        source: formData.source,
        status: formData.status,
        conversion_value: Number.parseFloat(formData.conversion_value) || 0,
        utm_source: formData.utm_source || null,
        utm_medium: formData.utm_medium || null,
        utm_campaign: formData.utm_campaign || null,
        notes: formData.notes || null,
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      })

      const result = await response.json()
      console.log("[v0] API Response:", result) // Added detailed API response logging

      if (!result.success) {
        if (result.code === "EMAIL_EXISTS") {
          console.log("[v0] Email already exists, showing error toast") // Added specific logging for email exists
          toast({
            title: "❌ Email já cadastrado",
            description: `O email "${formData.email}" já está cadastrado no sistema. Use um email diferente ou verifique se o cliente já existe.`,
            variant: "destructive",
            duration: 8000, // Increased duration to 8 seconds for better visibility
          })
          return
        }

        throw new Error(result.error || "Failed to insert client")
      }

      console.log("[v0] Client inserted successfully via API")

      const conversionValue = Number.parseFloat(formData.conversion_value) || 0

      console.log(`[v0] 🚀 Sending Facebook conversion in real-time: R$ ${conversionValue}`)

      if (conversionValue > 0 && formData.status === "converted") {
        // Send Purchase event for converted clients with value
        await trackPurchase({
          value: conversionValue,
          currency: "BRL",
          content_ids: [`client_${result.client?.id || Date.now()}`],
        })
        console.log("[v0] ✅ Facebook Purchase event sent for converted client")
      } else {
        // Send Lead event for all new registrations
        await trackLead({
          email: formData.email,
          phone: formData.phone,
          value: conversionValue,
        })
        console.log("[v0] ✅ Facebook Lead event sent for new registration")
      }

      if (typeof window !== "undefined" && window.fbq) {
        const eventType = conversionValue > 0 && formData.status === "converted" ? "Purchase" : "Lead"
        window.fbq("track", eventType, {
          value: conversionValue,
          currency: "BRL",
          content_name: "Client Registration",
          content_category: "Sales",
        })
        console.log(`[v0] 📊 Direct ${eventType} event sent as backup`)
      }

      const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || localStorage.getItem("facebook_pixel_id") || ""

      if (pixelId) {
        const eventName = conversionValue > 0 && formData.status === "converted" ? "Purchase" : "Lead"

        // Fire and forget - não espera resposta para não atrasar o feedback do usuário
        fetch("/api/conversions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event_name: `${eventName} - Registration`,
            event_value: conversionValue,
            facebook_event_id: `registration_${eventName.toLowerCase()}_${Date.now()}`,
            pixel_id: pixelId,
            metadata: {
              source: formData.source,
              utm_source: formData.utm_source,
              utm_medium: formData.utm_medium,
              utm_campaign: formData.utm_campaign,
              client_email: formData.email,
              content_type: "client_registration",
              registration_status: formData.status,
            },
          }),
        }).catch((error) => console.log("[v0] Conversion save error (non-blocking):", error))
      }

      toast({
        title: "🎉 CLIENTE CADASTRADO!",
        description: `${formData.name} foi adicionado com sucesso. Evento ${conversionValue > 0 && formData.status === "converted" ? "Purchase" : "Lead"} enviado para Facebook Ads em tempo real!`,
        duration: 10000,
        className: "border-green-500 bg-green-50 text-green-900",
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        whatsapp: "",
        source: "whatsapp",
        status: "lead",
        conversion_value: "0",
        utm_source: "",
        utm_medium: "",
        utm_campaign: "",
        notes: "",
      })
    } catch (error) {
      console.error("[v0] Error in handleSubmit:", error)
      toast({
        title: "❌ Erro ao cadastrar cliente",
        description:
          error instanceof Error ? error.message : "Ocorreu um erro inesperado. Verifique os dados e tente novamente.",
        variant: "destructive",
        duration: 8000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const isFormDisabled = tablesExist !== true || isLoading

  if (tablesExist === false) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-600">Cadastrar Novo Cliente</CardTitle>
          <CardDescription>Adicione um novo cliente ao sistema de vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Banco de Dados Não Configurado</strong>
              <br />
              As tabelas do banco de dados ainda não foram criadas.
              <br />
              <br />
              <div className="flex gap-2 mt-4">
                <Button onClick={setupDatabase} disabled={isCreatingTables} className="bg-blue-600 hover:bg-blue-700">
                  <Play className="h-4 w-4 mr-2" />
                  {isCreatingTables ? "Configurando..." : "Configurar Banco"}
                </Button>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Recarregar Página
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (tablesExist === null) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-600">Cadastrar Novo Cliente</CardTitle>
          <CardDescription>Verificando configuração do banco de dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-600">Cadastrar Novo Cliente</CardTitle>
        <CardDescription>Adicione um novo cliente ao sistema de vendas</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                type="text"
                placeholder="João Silva"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="joao@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="(11) 99999-9999"
                value={formData.whatsapp}
                onChange={(e) => handleInputChange("whatsapp", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Origem do Lead *</Label>
              <Select value={formData.source} onValueChange={(value) => handleInputChange("source", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                  <SelectItem value="organic">Orgânico</SelectItem>
                  <SelectItem value="referral">Indicação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="contacted">Contatado</SelectItem>
                  <SelectItem value="qualified">Qualificado</SelectItem>
                  <SelectItem value="converted">Convertido</SelectItem>
                  <SelectItem value="lost">Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversion_value">Valor da Conversão (R$)</Label>
            <Input
              id="conversion_value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.conversion_value}
              onChange={(e) => handleInputChange("conversion_value", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="utm_source">UTM Source</Label>
              <Input
                id="utm_source"
                type="text"
                placeholder="facebook"
                value={formData.utm_source}
                onChange={(e) => handleInputChange("utm_source", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_medium">UTM Medium</Label>
              <Input
                id="utm_medium"
                type="text"
                placeholder="cpc"
                value={formData.utm_medium}
                onChange={(e) => handleInputChange("utm_medium", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="utm_campaign">UTM Campaign</Label>
              <Input
                id="utm_campaign"
                type="text"
                placeholder="vendas_janeiro"
                value={formData.utm_campaign}
                onChange={(e) => handleInputChange("utm_campaign", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre o cliente..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isFormDisabled}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Cadastrando...
              </div>
            ) : tablesExist === false ? (
              "Banco não configurado"
            ) : (
              "Cadastrar Cliente"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
