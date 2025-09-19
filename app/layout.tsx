import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
// import { FacebookPixel } from "@/components/facebook-pixel"
import { FuturisticSidebar } from "@/components/futuristic-sidebar"
import { CompactProgressBar } from "@/components/compact-progress-bar"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Suspense } from "react"
import Image from "next/image"
import "./globals.css"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Dashboard de Vendas - Sistema Futurista",
  description: "Sistema futurista para gerenciar clientes, conversões e integração entre WhatsApp e Facebook Ads",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // const pixelId = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          <Suspense fallback={null}>
            {user && (
              <>
                <FuturisticSidebar />
                <div className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4 bg-background/80 backdrop-blur-sm border-b border-border/20">
                  <div className="flex items-center justify-between gap-2">
                    <div className="w-12 sm:w-16"></div>

                    {/* Logo - centered */}
                    <div className="flex items-center gap-2 bg-primary/10 backdrop-blur-sm rounded-full px-3 py-1.5 border border-primary/20">
                      <Image
                        src="/images/snipezap-logo.png"
                        alt="Snipezap"
                        width={24}
                        height={24}
                        className="w-6 h-6"
                      />
                      <span className="text-sm font-bold text-primary hidden sm:inline">Snipezap</span>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-2">
                      <ThemeToggle />
                      <CompactProgressBar />
                    </div>
                  </div>
                </div>
              </>
            )}

            <main className="min-h-screen">
              <div className={user ? "p-3 sm:p-6 pt-16 sm:pt-20" : "p-0"}>{children}</div>
            </main>
            <Analytics />
            {/* {pixelId && <FacebookPixel pixelId={pixelId} />} */}
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}
