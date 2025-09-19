"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface BackToHomeButtonProps {
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary"
  className?: string
}

export function BackToHomeButton({ variant = "outline", className }: BackToHomeButtonProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} className={className}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Início
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Navegação</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que quer voltar ao início? Qualquer alteração não salva será perdida.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href="/">Sim, voltar ao início</Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
