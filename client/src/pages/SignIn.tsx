import { useState, type FormEvent } from "react";
import { LogIn } from "lucide-react";
import { Link, Redirect, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { LOGO_FULL_SRC } from "@/components/Layout";
import { friendlyError } from "@/lib/errors";
import { trpc } from "@/lib/trpc";
import { usePageTitle } from "@/lib/usePageTitle";

export function SignInPage({ mode }: { mode: "sign-in" | "sign-up" }) {
  const signingUp = mode === "sign-up";
  usePageTitle(signingUp ? "Create an account" : "Sign in");
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);

  const options = {
    onSuccess: (signedIn: NonNullable<typeof user>) => {
      utils.auth.me.setData(undefined, signedIn);
      navigate(signedIn.role === "admin" ? "/admin" : "/account");
    },
    onError: (failure: unknown) => setError(friendlyError(failure)),
  };
  const login = trpc.auth.login.useMutation(options);
  const register = trpc.auth.register.useMutation(options);
  const pending = login.isPending || register.isPending;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (signingUp) register.mutate(form);
    else login.mutate({ email: form.email, password: form.password });
  };

  if (user && !pending && !login.isSuccess && !register.isSuccess) return <Redirect to={user.role === "admin" ? "/admin" : "/account"} />;

  return (
    <section className="auth-page container">
      <div className="auth-card card">
        <span className="footer-logo auth-logo"><img src={LOGO_FULL_SRC} alt="MPlace by Living Foods" width={96} height={110} /></span>
        <h1>{signingUp ? "Create your account" : "Welcome back"}</h1>
        <p className="muted">An account is optional. It lets you see your past orders. You can always order as a guest.</p>
        <form className="auth-form" onSubmit={submit}>
          {signingUp && <label>Your name<input required maxLength={120} autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label>}
          <label>Email address<input required type="email" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} /></label>
          {signingUp && <label>Phone (optional)<input type="tel" autoComplete="tel" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="0300 1234567" /></label>}
          <label>Password<input required type="password" minLength={signingUp ? 8 : 1} autoComplete={signingUp ? "new-password" : "current-password"} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} placeholder={signingUp ? "At least 8 characters" : ""} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-neon full" type="submit" disabled={pending || loading}><LogIn size={17} /> {pending ? "One moment…" : signingUp ? "Create account" : "Sign in"}</button>
        </form>
        <p className="small">{signingUp ? <>Already have an account? <Link href="/sign-in">Sign in</Link></> : <>New here? <Link href="/sign-up">Create an account</Link></>}</p>
      </div>
    </section>
  );
}
