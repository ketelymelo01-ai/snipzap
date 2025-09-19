-- Inserir dados de exemplo para demonstração
INSERT INTO public.clients (name, email, phone, whatsapp, source, status, conversion_value, utm_source, utm_medium, utm_campaign, notes) VALUES
('João Silva', 'joao@email.com', '11999999999', '11999999999', 'whatsapp', 'converted', 1500.00, 'whatsapp', 'direct', 'vendas_janeiro', 'Cliente convertido via WhatsApp'),
('Maria Santos', 'maria@email.com', '11888888888', '11888888888', 'facebook_ads', 'qualified', 0, 'facebook', 'cpc', 'campanha_leads', 'Lead qualificado do Facebook'),
('Pedro Costa', 'pedro@email.com', '11777777777', '11777777777', 'facebook_ads', 'converted', 2300.00, 'facebook', 'cpc', 'campanha_vendas', 'Conversão alta valor'),
('Ana Oliveira', 'ana@email.com', '11666666666', '11666666666', 'organic', 'lead', 0, 'google', 'organic', '', 'Lead orgânico do Google'),
('Carlos Ferreira', 'carlos@email.com', '11555555555', '11555555555', 'referral', 'contacted', 0, 'referral', 'word_of_mouth', '', 'Indicação de cliente'),
('Lucia Mendes', 'lucia@email.com', '11444444444', '11444444444', 'whatsapp', 'converted', 890.00, 'whatsapp', 'direct', 'vendas_fevereiro', 'Venda rápida WhatsApp'),
('Roberto Lima', 'roberto@email.com', '11333333333', '11333333333', 'facebook_ads', 'lost', 0, 'facebook', 'cpc', 'campanha_teste', 'Lead perdido - sem interesse'),
('Fernanda Rocha', 'fernanda@email.com', '11222222222', '11222222222', 'facebook_ads', 'qualified', 0, 'facebook', 'cpc', 'campanha_leads', 'Em negociação'),
('Marcos Alves', 'marcos@email.com', '11111111111', '11111111111', 'whatsapp', 'contacted', 0, 'whatsapp', 'direct', 'vendas_marco', 'Primeiro contato feito'),
('Juliana Souza', 'juliana@email.com', '11000000000', '11000000000', 'organic', 'converted', 1200.00, 'google', 'organic', '', 'Conversão orgânica');

-- Inserir algumas conversões de exemplo
INSERT INTO public.conversions (client_id, event_name, event_value, facebook_event_id, pixel_id) 
SELECT 
  id, 
  'Purchase', 
  conversion_value,
  'fb_event_' || SUBSTR(id::text, 1, 8),
  'pixel_123456789'
FROM public.clients 
WHERE status = 'converted' AND conversion_value > 0;
