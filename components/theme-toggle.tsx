"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-7 h-7 sm:w-9 sm:h-9 bg-black/20 backdrop-blur-md border border-green-500/20 hover:bg-green-500/10"
      >
        <Sun className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-7 h-7 sm:w-9 sm:h-9 bg-black/20 backdrop-blur-md border border-green-500/20 hover:bg-green-500/10 transition-all duration-300"
    >
      {theme === "dark" ? (
        <Sun className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 transition-all duration-300" />
      ) : (
        <Moon className="h-3 w-3 sm:h-4 sm:w-4 text-green-400 transition-all duration-300" />
      )}
    </Button>
  )
}
