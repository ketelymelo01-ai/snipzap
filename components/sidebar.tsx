"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Users, UserPlus, BarChart3, PieChart, Facebook, Menu, X } from "lucide-react"
import { useState } from "react"

const menuItems = [
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
    title: "Integrações",
    items: [
      {
        title: "Facebook Ads",
        href: "/facebook-ads",
        icon: Facebook,
        description: "Configurar pixel e ROAS",
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-40 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
          isCollapsed && "md:translate-x-0 -translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Dashboard Vendas</h2>
            <p className="text-sm text-gray-600">Sistema de Gestão</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item, index) => (
              <div key={index}>
                {item.href ? (
                  // Single menu item
                  <Link href={item.href}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-auto p-3",
                        pathname === item.href && "bg-blue-600 text-white hover:bg-blue-700",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <div className="text-left">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-xs opacity-70">{item.description}</div>
                      </div>
                    </Button>
                  </Link>
                ) : (
                  // Menu section with items
                  <div className="space-y-1">
                    <div className="px-3 py-2">
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{item.title}</h3>
                    </div>
                    {item.items?.map((subItem, subIndex) => (
                      <Link key={subIndex} href={subItem.href}>
                        <Button
                          variant={pathname === subItem.href ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3 h-auto p-3 ml-2",
                            pathname === subItem.href && "bg-blue-600 text-white hover:bg-blue-700",
                          )}
                        >
                          <subItem.icon className="h-4 w-4" />
                          <div className="text-left">
                            <div className="font-medium">{subItem.title}</div>
                            <div className="text-xs opacity-70">{subItem.description}</div>
                          </div>
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">v0.app Dashboard System</div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" onClick={() => setIsCollapsed(true)} />
      )}
    </>
  )
}
