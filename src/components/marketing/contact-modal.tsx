'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Dictionary } from '@/components/internationalization/types'

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10),
})

type ContactFormData = z.infer<typeof contactSchema>

interface ContactModalProps {
  dictionary: Dictionary
  children: React.ReactNode
}

export function ContactModal({ dictionary, children }: ContactModalProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { contact } = dictionary.marketing

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })

  const onSubmit = async (data: ContactFormData) => {
    // In production, this would send to an API
    console.log('Contact form submitted:', data)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    setSubmitted(true)
    reset()

    // Close modal after showing success
    setTimeout(() => {
      setOpen(false)
      setSubmitted(false)
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{contact.title}</DialogTitle>
          <DialogDescription>{contact.subtitle}</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-muted-foreground">{contact.success}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{contact.name}</Label>
              <Input
                id="name"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{contact.email}</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{contact.phone}</Label>
              <Input
                id="phone"
                type="tel"
                {...register('phone')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{contact.message}</Label>
              <Textarea
                id="message"
                rows={4}
                {...register('message')}
                className={errors.message ? 'border-destructive' : ''}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? '...' : contact.submit}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
