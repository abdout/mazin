"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { LoginSchema } from "../validation";
import { login } from "./action";
import { FormError } from "../error/form-error";
import { FormSuccess } from "../form-success";
import { Social } from "../social";
import type { Dictionary } from "@/components/internationalization/types";

interface LoginFormProps extends React.ComponentPropsWithoutRef<"div"> {
  dictionary: Dictionary;
}

export const LoginForm = ({
  dictionary,
  className,
  ...props
}: LoginFormProps) => {
  const searchParams = useSearchParams();
  const params = useParams();
  const lang = params.lang || "en";
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? dictionary?.auth?.errors?.emailInUseProvider || "Email already in use with different provider!"
    : "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }
          if (data?.success) {
            form.reset();
            setSuccess(data.success);
          }
          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => setError(dictionary?.auth?.errors?.somethingWrong || "Something went wrong"));
    });
  };

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      <Social dictionary={dictionary} />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-base text-muted-foreground">{dictionary?.auth?.orContinueWith || "Or continue with"}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {showTwoFactor && (
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder={dictionary?.auth?.twoFactorCode || "Code"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {!showTwoFactor && (
            <>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder={dictionary?.auth?.enterEmail || "Email"}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder={dictionary?.auth?.enterPassword || "Password"}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Link
                  href={`/${lang}/reset`}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {dictionary?.auth?.forgotPassword || "Forgot password?"}
                </Link>
              </div>
            </>
          )}

          <FormError message={error || urlError} />
          <FormSuccess message={success} />

          <Button disabled={isPending} type="submit" className="w-full h-12 text-base">
            {showTwoFactor
              ? (dictionary?.auth?.confirm || "Confirm")
              : (dictionary?.auth?.login || "Login")
            }
          </Button>

          <div className="text-center text-sm">
            {dictionary?.auth?.dontHaveAccount || "Don't have an account?"}
            {" "}
            <Link href={`/${lang}/join`} className="text-primary hover:underline">
              {dictionary?.auth?.signUp || "Sign Up"}
            </Link>
          </div>
        </form>
      </Form>
    </div>
  );
};