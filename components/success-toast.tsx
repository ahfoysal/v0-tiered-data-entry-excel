"use client"
import { useToast } from "@/components/ui/use-toast"

export function useSuccessToast() {
  const { toast } = useToast()

  return {
    success: (message: string, description?: string) => {
      toast({
        title: message,
        description,
        className: "bg-green-50 border-green-200 border-l-4 border-l-green-500",
      })
    },
    error: (message: string, description?: string) => {
      toast({
        title: message,
        description,
        className: "bg-red-50 border-red-200 border-l-4 border-l-red-500",
        variant: "destructive",
      })
    },
    info: (message: string, description?: string) => {
      toast({
        title: message,
        description,
        className: "bg-blue-50 border-blue-200 border-l-4 border-l-blue-500",
      })
    },
  }
}
