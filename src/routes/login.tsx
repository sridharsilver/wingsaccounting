import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useEffect } from "react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Official Supabase way to detect recovery mode
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // 2. URL-based fallback
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const isRecoveryInUrl = hash.includes("type=recovery") || 
                           searchParams.get("type") === "recovery" ||
                           window.location.href.includes("type=recovery");

    if (isRecoveryInUrl) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else if (data.session) {
      toast.success("Welcome back!");
      navigate({ to: "/" });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    
    setResetLoading(true);
    console.log("Sending reset link to:", resetEmail);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}${window.location.pathname}?type=recovery`,
    });
    
    if (error) {
      console.error("Reset error:", error);
      toast.error(error.message);
    } else {
      toast.success("Success! Please check your email for the reset link.");
      setShowResetModal(false);
    }
    setResetLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated! You can now sign in.");
      setIsRecovery(false);
      setNewPassword("");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <Logo className="h-10 hover:scale-105 transition-transform" />
          </Link>
        </div>

        <div className="glass rounded-3xl p-8 shadow-elegant border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-brand" />
          
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              {isRecovery ? "Set New Password" : "Admin Portal"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRecovery ? "Choose a strong password for your account" : "Sign in to manage your studio"}
            </p>
          </div>

          {isRecovery ? (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-surface/50 border-white/10 focus:border-brand"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-brand text-brand-foreground shadow-glow hover:brightness-110 transition-all font-semibold h-11"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Password"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setIsRecovery(false)}
                className="w-full text-xs text-muted-foreground"
              >
                Cancel
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@wingsgraphics.com"
                    className="pl-10 bg-surface/50 border-white/10 focus:border-brand"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-surface/50 border-white/10 focus:border-brand"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div className="flex justify-end">
                  <Button 
                    type="button" 
                    variant="link"
                    onClick={() => setShowResetModal(true)}
                    className="h-auto p-0 text-xs text-brand hover:text-brand/80 font-medium"
                  >
                    Forgot password?
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-brand text-brand-foreground shadow-glow hover:brightness-110 transition-all font-semibold h-11"
                disabled={loading}
              >
                {loading ? "Authenticating..." : "Sign In"}
              </Button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">
            ← Back to website
          </Link>
        </div>
      </div>

      {/* Reset Password Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="glass border-white/10 max-w-sm">
          <DialogHeader>
            <div className="size-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-4">
              <ShieldCheck size={24} />
            </div>
            <DialogTitle className="text-xl">Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email and we'll send you a link to get back into your account.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleResetPassword} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="admin@wingsgraphics.com"
                  className="pl-10"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-brand text-brand-foreground font-bold"
                disabled={resetLoading}
              >
                {resetLoading ? "Sending Link..." : "Send Reset Link"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
