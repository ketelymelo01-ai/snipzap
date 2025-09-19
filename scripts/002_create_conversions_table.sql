-- Criar tabela de conversões para rastrear eventos do Facebook Ads
CREATE TABLE IF NOT EXISTS public.conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_value DECIMAL(10,2) DEFAULT 0,
  facebook_event_id TEXT,
  pixel_id TEXT,
  conversion_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Habilitar Row Level Security
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Allow all operations on conversions" ON public.conversions
  FOR ALL USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conversions_client_id ON public.conversions(client_id);
CREATE INDEX IF NOT EXISTS idx_conversions_event_name ON public.conversions(event_name);
CREATE INDEX IF NOT EXISTS idx_conversions_conversion_date ON public.conversions(conversion_date);
