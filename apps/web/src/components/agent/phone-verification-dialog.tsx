"use client";
import { useState, useCallback } from "react";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  toast,
  PhoneInput,
} from "@sicap/ui";

import { authClient } from "@sicap/data/auth-client";

const phoneSchema = z
  .string()
  .min(5)
  .regex(/^[+]?\d[\d\s-]{5,}$/);

interface PhoneVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}

export function PhoneVerificationDialog({
  open,
  onOpenChange,
  onVerified,
}: PhoneVerificationDialogProps) {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);

  const startVerification = useCallback(async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error("Număr de telefon invalid");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await authClient.phoneNumber.sendOtp({ phoneNumber: phone });
      if (error) {
        throw new Error(error.message || "Eroare la trimiterea codului");
      }
      setStep("otp");
      setCooldown(60);
      const interval = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) {
            clearInterval(interval);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Eroare";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [phone]);

  const verifyCode = useCallback(async () => {
    if (code.trim().length < 4) {
      toast.error("Cod invalid");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code,
        updatePhoneNumber: true,
      });
      if (error) {
        throw new Error(error.message || "Cod invalid sau expirat");
      }
      await authClient.getSession({ query: { disableCookieCache: true } });
      toast.success("Telefon verificat");
      onOpenChange(false);
      onVerified?.();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Eroare";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [phone, code, onOpenChange, onVerified]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verifică numărul de telefon</DialogTitle>
          <DialogDescription>
            Pentru a continua conversația, te rugăm să îți verifici numărul de telefon.
          </DialogDescription>
        </DialogHeader>
        {step === "phone" ? (
          <div className="space-y-4">
            <PhoneInput
              placeholder="Ex: +407XXXXXXXX"
              value={phone}
              onChange={(p) => setPhone(p)}
              inputMode="tel"
            />
            <DialogFooter>
              <Button disabled={isSubmitting} onClick={startVerification}>
                Trimite codul
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <InputOTP maxLength={6} value={code} onChange={(e) => setCode(e)}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator index={0} />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>

            <div className="text-sm text-muted-foreground">
              {cooldown > 0 ? `Poți retrimite codul în ${cooldown}s` : ""}
            </div>
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                disabled={cooldown > 0 || isSubmitting}
                onClick={startVerification}
              >
                Retrimite codul
              </Button>
              <Button disabled={isSubmitting} onClick={verifyCode}>
                Verifică
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
