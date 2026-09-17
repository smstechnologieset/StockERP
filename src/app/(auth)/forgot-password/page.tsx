"use client";

import { useState } from "react";
import Link from "next/link";
import { Wheat, ArrowLeft, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const { t } = useLanguage();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50/60 via-background to-orange-50/40 p-4 relative">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      {/* Background Decorative Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-xl border-amber-600/20 glass-panel relative z-10">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-600/30">
            <Wheat className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading text-foreground pt-2">
            {t("forgot_password_title")}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {t("forgot_password_subtitle")}
          </p>
        </CardHeader>

        <CardContent>
          {/* Error message */}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {sent ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-base mb-1">
                  {t("forgot_password_success_title")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("forgot_password_success_desc")}{" "}
                  <span className="font-medium text-amber-700 dark:text-amber-400 break-all">
                    {email}
                  </span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border">
                {t("forgot_password_success_note")}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400 hover:underline mt-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("forgot_password_back_to_login")}
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reset-email">{t("login_email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="name@trading.et"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-background/80 pl-9"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 shadow-md shadow-amber-600/20 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("forgot_password_sending")}
                  </>
                ) : (
                  t("forgot_password_submit")
                )}
              </Button>

              <div className="text-center pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t("forgot_password_back_to_login")}
                </Link>
              </div>
            </form>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground bg-muted/20 rounded-b-xl">
          {t("login_footer")}
        </CardFooter>
      </Card>
    </div>
  );
}
