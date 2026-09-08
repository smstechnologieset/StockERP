"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wheat, ShieldCheck, UserCheck, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Fetch role from profiles
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (profile?.role === "owner_manager") {
          router.push("/manager");
        } else {
          router.push("/staff");
        }
        router.refresh();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
    } finally {
      setLoading(false);
    }
  }

  // Quick fill helper for the test accounts
  function fillCredentials(role: "manager" | "staff") {
    if (role === "manager") {
      setEmail("manager@stockerp.et");
      setPassword("Password123!");
    } else {
      setEmail("staff@stockerp.et");
      setPassword("Password123!");
    }
    setErrorMessage(null);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50/60 via-background to-orange-50/40 p-4">
      {/* Background Decorative Circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-xl border-amber-600/20 glass-panel relative z-10">
        <CardHeader className="text-center space-y-2 pb-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-600/30">
            <Wheat className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold font-heading text-foreground pt-2">
            Grain & Powder ERP
          </CardTitle>
          <CardDescription className="text-sm">
            Addis Ababa Commodity Trading & Inventory Management
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-700 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@trading.et"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background/80"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/80"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 shadow-md shadow-amber-600/20 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Fill Test Accounts */}
          <div className="mt-8 pt-6 border-t">
            <div className="text-center mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quick-Fill Test Credentials
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("manager")}
                className="flex items-center gap-2 border-amber-600/30 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
                <span>Fill Manager</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillCredentials("staff")}
                className="flex items-center gap-2 border-blue-600/30 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs"
              >
                <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>Fill Staff</span>
              </Button>
            </div>
            <div className="mt-3 p-2.5 rounded-lg bg-muted/40 text-[11px] text-muted-foreground space-y-1">
              <div>
                <strong>Manager:</strong> <code className="text-foreground">manager@stockerp.et</code> / <code className="text-foreground">Password123!</code>
              </div>
              <div>
                <strong>Staff:</strong> <code className="text-foreground">staff@stockerp.et</code> / <code className="text-foreground">Password123!</code>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground bg-muted/20 rounded-b-xl">
          Protected by Supabase Row Level Security & JWT
        </CardFooter>
      </Card>
    </div>
  );
}
