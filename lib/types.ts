export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  whatsapp?: string
  source: "whatsapp" | "facebook_ads" | "organic" | "referral"
  status: "lead" | "contacted" | "qualified" | "converted" | "lost"
  conversion_value: number
  facebook_pixel_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Conversion {
  id: string
  client_id: string
  event_name: string
  event_value: number
  facebook_event_id?: string
  pixel_id?: string
  conversion_date: string
  metadata: Record<string, any>
}

export interface DashboardMetrics {
  totalClients: number
  totalConversions: number
  totalRevenue: number
  conversionRate: number
  averageTicket: number
  leadsBySource: Record<string, number>
  conversionsByStatus: Record<string, number>
}
