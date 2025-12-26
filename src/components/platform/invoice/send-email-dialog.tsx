"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Mail, Loader2, Send, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { sendInvoiceEmail } from "@/actions/invoice"
import type { Dictionary } from "@/components/internationalization/types"
import type { Locale } from "@/components/internationalization"

const emailFormSchema = z.object({
  recipientEmail: z.string().email("Invalid email address"),
  message: z.string().optional(),
})

type EmailFormValues = z.infer<typeof emailFormSchema>

interface SendEmailDialogProps {
  invoiceId: string
  invoiceNumber: string
  clientEmail?: string | null
  dictionary: Dictionary
  locale: Locale
  children?: React.ReactNode
}

export function SendEmailDialog({
  invoiceId,
  invoiceNumber,
  clientEmail,
  dictionary,
  locale,
  children,
}: SendEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const t = dictionary.invoices

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      recipientEmail: clientEmail || "",
      message: "",
    },
  })

  const onSubmit = async (values: EmailFormValues) => {
    setStatus("sending")
    setErrorMessage("")

    try {
      await sendInvoiceEmail(
        invoiceId,
        values.recipientEmail,
        locale,
        values.message || undefined
      )
      setStatus("success")
      setTimeout(() => {
        setOpen(false)
        setStatus("idle")
        form.reset()
      }, 2000)
    } catch (error) {
      setStatus("error")
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to send email"
      )
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && status === "sending") return
    setOpen(newOpen)
    if (!newOpen) {
      setStatus("idle")
      setErrorMessage("")
      form.reset({ recipientEmail: clientEmail || "", message: "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 me-2" />
            {t.sendEmail}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t.sendEmail}</DialogTitle>
          <DialogDescription>
            {t.sendEmailDescription?.replace("{invoiceNumber}", invoiceNumber) ||
              `Send invoice ${invoiceNumber} via email`}
          </DialogDescription>
        </DialogHeader>

        {status === "success" ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium">{t.emailSent}</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="recipientEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.emailRecipient}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="client@example.com"
                        {...field}
                        disabled={status === "sending"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t.emailMessage || "Message (Optional)"}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t.emailMessagePlaceholder || "Add a personal message..."}
                        className="resize-none"
                        rows={3}
                        {...field}
                        disabled={status === "sending"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {status === "error" && errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={status === "sending"}
                >
                  {dictionary.common.cancel || "Cancel"}
                </Button>
                <Button type="submit" disabled={status === "sending"}>
                  {status === "sending" ? (
                    <>
                      <Loader2 className="h-4 w-4 me-2 animate-spin" />
                      {t.sending || "Sending..."}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 me-2" />
                      {t.confirmSend}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
