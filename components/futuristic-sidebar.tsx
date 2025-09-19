"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BarChart3, Users, UserPlus, PieChart, Facebook, Menu, X, Zap, TrendingUp, Target } from "lucide-react"
import { useState } from "react"
import Image from "next/image"

const menuItems = [
  {
    title: "Analytics",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: BarChart3,
        description: "Métricas e KPIs",
      },
      {
        title: "Relatórios",
        href: "/relatorios",
        icon: PieChart,
        description: "Gráficos e visualizações",
      },
    ],
  },
  {
    title: "Gestão",
    items: [
      {
        title: "Cadastrar Cliente",
        href: "/cadastro",
        icon: UserPlus,
        description: "Adicionar novos clientes",
      },
      {
        title: "Gerenciar Clientes",
        href: "/clientes",
        icon: Users,
        description: "Visualizar e editar clientes",
      },
    ],
  },
  {
    title: "Integrações",
    items: [
      {
        title: "Facebook Ads",
        href: "/facebook-ads",
        icon: Facebook,
        description: "Configurar pixel e ROAS",
      },
      {
        title: "Campanhas",
        href: "/campanhas",
        icon: Target,
        description: "Monitorar campanhas em tempo real",
      },
    ],
  },
]

export function FuturisticSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Menu Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-16 left-2 sm:top-20 sm:left-4 z-50 glass-effect hover:bg-primary/20 transition-all duration-300 w-10 h-10 sm:w-12 sm:h-12 border border-primary/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-72 sm:w-80 glass-effect transition-transform duration-500 ease-out slide-in",
          !isOpen && "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/snipezap-logo.png"
                  alt="Snipezap Logo"
                  width={40}
                  height={40}
                  className="w-8 h-8 sm:w-10 sm:h-10"
                />
                <div>
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Snipezap
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">Sales Dashboard</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="hover:bg-destructive/20 w-8 h-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-y-auto">
            {menuItems.map((section, index) => (
              <div key={index} className="space-y-2">
                <div className="px-2 sm:px-3 py-1 sm:py-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    {section.title}
                  </h3>
                </div>
                {section.items?.map((item, itemIndex) => (
                  <Link key={itemIndex} href={item.href}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-2 sm:gap-3 h-auto p-3 sm:p-4 transition-all duration-300 hover:scale-105",
                        pathname === item.href
                          ? "bg-primary text-primary-foreground pulse-glow"
                          : "hover:bg-primary/10 hover:text-primary",
                      )}
                    >
                      <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <div className="font-medium text-sm sm:text-base truncate">{item.title}</div>
                        <div className="text-xs opacity-70 truncate">{item.description}</div>
                      </div>
                    </Button>
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-3 sm:p-4 border-t border-border/50">
            <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-2">
              <TrendingUp className="h-3 w-3" />
              <span className="hidden sm:inline">Snipezap System v1.0</span>
              <span className="sm:hidden">Snipezap v1.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" onClick={() => setIsOpen(false)} />}
    </>
  )
}
