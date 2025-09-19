"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import type { Client } from "@/lib/types"
import { Search, Edit, Trash2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { trackPurchase } from "@/lib/facebook-events"

const statusColors = {
  lead: "bg-gray-100 text-gray-800",
  contacted: "bg-blue-100 text-blue-800",
  qualified: "bg-yellow-100 text-yellow-800",
  converted: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
}

const sourceColors = {
  whatsapp: "bg-green-100 text-green-800",
  facebook_ads: "bg-blue-100 text-blue-800",
  organic: "bg-purple-100 text-purple-800",
  referral: "bg-orange-100 text-orange-800",
}

export function ClientManagementTable() {
  const { toast } = useToast()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [tablesExist, setTablesExist] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const checkTablesExist = async () => {
    try {
      const supabase = createClient()
      // Try to query the clients table directly - if it exists, this will work
      const { error } = await supabase.from("clients").select("id").limit(1)

      // If no error, table exists
      if (!error) {
        console.log("[v0] Clients table exists and is accessible")
        return true
      }

      // If error is about table not existing, return false
      if (error.message.includes('relation "public.clients" does not exist')) {
        console.log("[v0] Clients table does not exist")
        return false
      }

      // For other errors, assume table exists but there might be other issues
      console.log("[v0] Table check completed with minor error:", error.message)
      return true
    } catch (error) {
      console.log("[v0] Error checking table existence:", error)
      return false
    }
  }

  const fetchClients = async () => {
    try {
      const tablesExistCheck = await checkTablesExist()
      setTablesExist(tablesExistCheck)

      if (!tablesExistCheck) {
        console.log("[v0] Tables not found, skipping data fetch")
        setClients([])
        setFilteredClients([])
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase.from("clients").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setClients(data || [])
      setFilteredClients(data || [])
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    let filtered = clients

    if (searchTerm) {
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phone?.includes(searchTerm) ||
          client.whatsapp?.includes(searchTerm),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((client) => client.status === statusFilter)
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter((client) => client.source === sourceFilter)
    }

    setFilteredClients(filtered)
  }, [clients, searchTerm, statusFilter, sourceFilter])

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingClient || !tablesExist) return

    try {
      const originalClient = clients.find((c) => c.id === editingClient.id)
      const wasConverted = originalClient?.status === "converted"
      const isNowConverted = editingClient.status === "converted"

      const supabase = createClient()
      const { error } = await supabase
        .from("clients")
        .update({
          name: editingClient.name,
          email: editingClient.email,
          phone: editingClient.phone,
          whatsapp: editingClient.whatsapp,
          source: editingClient.source,
          status: editingClient.status,
          conversion_value: editingClient.conversion_value,
          utm_source: editingClient.utm_source,
          utm_medium: editingClient.utm_medium,
          utm_campaign: editingClient.utm_campaign,
          notes: editingClient.notes,
        })
        .eq("id", editingClient.id)

      if (error) throw error

      if (!wasConverted && isNowConverted && editingClient.conversion_value > 0) {
        console.log(`[v0] 🎯 Cliente convertido! Enviando Purchase para Facebook: R$ ${editingClient.conversion_value}`)

        trackPurchase({
          value: editingClient.conversion_value,
          currency: "BRL",
          content_ids: [`client_${editingClient.id}`],
        })

        const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || localStorage.getItem("facebook_pixel_id") || ""
        if (pixelId) {
          fetch("/api/conversions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              event_name: "Purchase - Status Update",
              event_value: editingClient.conversion_value,
              facebook_event_id: `status_conversion_${editingClient.id}_${Date.now()}`,
              pixel_id: pixelId,
              metadata: {
                client_id: editingClient.id,
                client_email: editingClient.email,
                source: editingClient.source,
                utm_source: editingClient.utm_source,
                utm_medium: editingClient.utm_medium,
                utm_campaign: editingClient.utm_campaign,
                conversion_type: "status_update",
              },
            }),
          }).catch((error) => console.log("[v0] Conversion save error (non-blocking):", error))
        }
      }

      toast({
        title: "Cliente atualizado!",
        description:
          isNowConverted && !wasConverted
            ? `${editingClient.name} foi convertido! Evento enviado para Facebook Ads.`
            : "As informações do cliente foram salvas com sucesso.",
      })

      setIsEditDialogOpen(false)
      setEditingClient(null)
      fetchClients()
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (clientId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?") || !tablesExist) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("clients").delete().eq("id", clientId)

      if (error) throw error

      toast({
        title: "Cliente excluído!",
        description: "O cliente foi removido do sistema.",
      })

      fetchClients()
    } catch (error) {
      console.error("Erro ao excluir cliente:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o cliente.",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando clientes...</div>
        </CardContent>
      </Card>
    )
  }

  if (!tablesExist) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-600">Gerenciamento de Clientes</CardTitle>
          <CardDescription>Visualize, edite e gerencie todos os seus clientes e leads</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold">Banco de Dados Não Configurado</p>
                <p>As tabelas do banco de dados ainda não foram criadas. Execute os scripts SQL primeiro.</p>
                <div className="mt-4">
                  <p className="font-medium">Para configurar o banco de dados:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      Execute o script:{" "}
                      <code className="bg-gray-100 px-1 rounded">scripts/001_create_clients_table.sql</code>
                    </li>
                    <li>
                      Execute o script:{" "}
                      <code className="bg-gray-100 px-1 rounded">scripts/002_create_conversions_table.sql</code>
                    </li>
                    <li>
                      Execute o script:{" "}
                      <code className="bg-gray-100 px-1 rounded">scripts/003_seed_sample_data.sql</code>
                    </li>
                    <li>Recarregue esta página</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-blue-600">Gerenciamento de Clientes</CardTitle>
        <CardDescription>Visualize, edite e gerencie todos os seus clientes e leads</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="contacted">Contatado</SelectItem>
                <SelectItem value="qualified">Qualificado</SelectItem>
                <SelectItem value="converted">Convertido</SelectItem>
                <SelectItem value="lost">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-48">
            <Label htmlFor="source-filter">Origem</Label>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as origens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as origens</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                <SelectItem value="organic">Orgânico</SelectItem>
                <SelectItem value="referral">Indicação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Mostrando {filteredClients.length} de {clients.length} clientes
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.whatsapp || client.phone || "-"}</TableCell>
                  <TableCell>
                    <Badge className={sourceColors[client.source]}>
                      {client.source === "whatsapp" && "WhatsApp"}
                      {client.source === "facebook_ads" && "Facebook Ads"}
                      {client.source === "organic" && "Orgânico"}
                      {client.source === "referral" && "Indicação"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[client.status]}>
                      {client.status === "lead" && "Lead"}
                      {client.status === "contacted" && "Contatado"}
                      {client.status === "qualified" && "Qualificado"}
                      {client.status === "converted" && "Convertido"}
                      {client.status === "lost" && "Perdido"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(client.conversion_value)}</TableCell>
                  <TableCell>{formatDate(client.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(client)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(client.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredClients.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhum cliente encontrado com os filtros aplicados.</p>
          </div>
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
              <DialogDescription>Atualize as informações do cliente</DialogDescription>
            </DialogHeader>
            {editingClient && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Nome</Label>
                    <Input
                      id="edit-name"
                      value={editingClient.name}
                      onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      value={editingClient.email}
                      onChange={(e) => setEditingClient({ ...editingClient, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-phone">Telefone</Label>
                    <Input
                      id="edit-phone"
                      value={editingClient.phone || ""}
                      onChange={(e) => setEditingClient({ ...editingClient, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-whatsapp">WhatsApp</Label>
                    <Input
                      id="edit-whatsapp"
                      value={editingClient.whatsapp || ""}
                      onChange={(e) => setEditingClient({ ...editingClient, whatsapp: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-source">Origem</Label>
                    <Select
                      value={editingClient.source}
                      onValueChange={(value) => setEditingClient({ ...editingClient, source: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="facebook_ads">Facebook Ads</SelectItem>
                        <SelectItem value="organic">Orgânico</SelectItem>
                        <SelectItem value="referral">Indicação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Select
                      value={editingClient.status}
                      onValueChange={(value) => setEditingClient({ ...editingClient, status: value as any })}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                <div>
                  <Label htmlFor="edit-value">Valor da Conversão</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    step="0.01"
                    value={editingClient.conversion_value}
                    onChange={(e) =>
                      setEditingClient({ ...editingClient, conversion_value: Number.parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Observações</Label>
                  <Textarea
                    id="edit-notes"
                    value={editingClient.notes || ""}
                    onChange={(e) => setEditingClient({ ...editingClient, notes: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveEdit}>Salvar</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
