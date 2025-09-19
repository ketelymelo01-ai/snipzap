import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Sparkles, Rocket } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-primary/5">
      <div className="max-w-7xl mx-auto px-4 py-8 pt-20">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              SNIPZAP
            </h1>
            <Sparkles className="h-8 w-8 text-secondary" />
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Sistema avançado para gerenciar clientes, conversões e integração entre WhatsApp e Facebook Ads
          </p>
        </div>

        <div className="flex justify-center">
          <Card className="glass-effect border-primary/20 hover:border-primary/40 transition-all duration-300 hover:scale-105 p-6 max-w-md">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2 justify-center">
                <Sparkles className="h-5 w-5" />
                Acesse o Sistema
              </CardTitle>
              <CardDescription className="text-center">Faça login para acessar o dashboard completo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/auth/login">
                <Button className="w-full bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105">
                  <Users className="h-4 w-4 mr-2" />
                  Fazer Login
                </Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button variant="outline" className="w-full transition-all duration-300 hover:scale-105 bg-transparent">
                  <Rocket className="h-4 w-4 mr-2" />
                  Criar Conta
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
