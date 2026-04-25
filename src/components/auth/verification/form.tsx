"use client";

import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { FormSuccess } from "../form-success";
import { FormError } from "../error/form-error";
import { newVerification } from "./action";

export const NewVerificationForm = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Missing token!");
      return;
    }
    let cancelled = false;
    newVerification(token)
      .then((data) => {
        if (cancelled) return;
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        if (!cancelled) setError("Something went wrong!");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className={cn("flex flex-col gap-6 w-full", className)} {...props}>
      <Card className="border-none shadow-none bg-background">
        <CardHeader className="text-center">
          <h1 className="text-xl font-semibold">Confirming your verification</h1>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex items-center w-full justify-center">
              {!success && !error && (
                <BeatLoader />
              )}
              <FormSuccess message={success} />
              {!success && (
                <FormError message={error} />
              )}
            </div>

            <div className="text-center text-sm">
              <Link href="/login" className="hover:underline underline-offset-4">
                Back to login
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
