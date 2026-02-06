'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { MessageCircle, Phone, Mail, CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Dictionary } from '@/components/internationalization';
import { isRTL } from '@/components/internationalization/config';
import type { Locale } from '@/components/internationalization';
import type { z } from 'zod';
import { createServiceRequest } from './actions';
import { serviceRequestSchema, type ServiceRequestData } from './validation';
import type { ServiceListingWithRelations } from './types';

type ServiceRequestFormValues = z.input<typeof serviceRequestSchema>;

// Normalize phone for WhatsApp (Sudan country code)
function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    return '249' + cleaned.substring(1);
  }
  return cleaned.replace(/^\+/, '');
}

interface OrderFormProps {
  service: ServiceListingWithRelations;
  dictionary: Dictionary;
  locale: Locale;
}

export function OrderForm({ service, dictionary, locale }: OrderFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const [requestData, setRequestData] = useState<{
    requestNumber: string;
    vendor: {
      businessName: string;
      whatsappNumber: string | null;
      phone: string | null;
      email: string | null;
    };
  } | null>(null);
  const rtl = isRTL(locale);

  const form = useForm<ServiceRequestFormValues>({
    resolver: zodResolver(serviceRequestSchema) as never,
    defaultValues: {
      serviceId: service.id,
      requesterName: '',
      requesterPhone: '',
      requesterEmail: '',
      requesterWhatsApp: '',
      message: '',
      quantity: 1,
    },
  });

  const onSubmit = (data: ServiceRequestFormValues) => {
    startTransition(async () => {
      const result = await createServiceRequest(data as ServiceRequestData);

      if (result.success && result.request) {
        setSubmitted(true);
        setRequestData({
          requestNumber: result.request.requestNumber,
          vendor: result.request.vendor,
        });
        toast.success(
          dictionary.marketplace?.orderPlaced || 'Request submitted successfully'
        );
      } else {
        toast.error(result.error || 'Failed to submit request');
      }
    });
  };

  if (submitted && requestData) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            <CardTitle>
              {dictionary.marketplace?.orderPlaced || 'Request Submitted'}
            </CardTitle>
          </div>
          <CardDescription>
            {dictionary.marketplace?.request?.success ||
              'Your request has been submitted! The vendor will contact you soon.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <span className="font-medium">Request #: </span>
            <span>{requestData.requestNumber}</span>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">
              {dictionary.marketplace?.request?.contactInfo ||
                'Vendor Contact Information'}
            </h4>
            <div className="space-y-2">
              <p className="text-sm font-medium">{requestData.vendor.businessName}</p>
              <div className="flex flex-wrap gap-3">
                {requestData.vendor.whatsappNumber && (
                  <a
                    href={`https://wa.me/${normalizePhone(requestData.vendor.whatsappNumber)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-md text-sm hover:bg-green-200 transition-colors"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {dictionary.marketplace?.whatsapp || 'WhatsApp'}
                  </a>
                )}
                {requestData.vendor.phone && (
                  <a
                    href={`tel:${requestData.vendor.phone}`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {requestData.vendor.phone}
                  </a>
                )}
                {requestData.vendor.email && (
                  <a
                    href={`mailto:${requestData.vendor.email}`}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-orange-100 text-orange-700 rounded-md text-sm hover:bg-orange-200 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {dictionary.marketplace?.email || 'Email'}
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {dictionary.marketplace?.request?.title || 'Request Service'}
        </CardTitle>
        <CardDescription>
          {rtl
            ? service.titleAr || service.title
            : service.title}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="requesterName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dictionary.marketplace?.request?.name || 'Your Name'}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requesterPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dictionary.marketplace?.request?.phone || 'Phone Number'}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requesterEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dictionary.marketplace?.request?.email || 'Email (optional)'}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {dictionary.marketplace?.request?.quantity || 'Quantity'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
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
                  <FormLabel>
                    {dictionary.marketplace?.request?.message ||
                      'Message to vendor (optional)'}
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {dictionary.common?.loading || 'Loading...'}
                </>
              ) : (
                dictionary.marketplace?.request?.submit || 'Submit Request'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
