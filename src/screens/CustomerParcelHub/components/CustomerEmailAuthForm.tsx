import { useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon, Loader2, MailIcon, UserIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { GhanaPhoneInput } from "../../../components/GhanaPhoneInput";
import { useCustomerAuth } from "../../../contexts/CustomerAuthContext";
import { validatePhoneNumber } from "../../../utils/dataHelpers";
import type { GoogleCredentialPayload } from "../../../utils/googleAuth";
import { GoogleSignInButton } from "./GoogleSignInButton";

export type AuthMode = "signup" | "signin";

interface Props {
  phone: string;
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: () => void;
  onGoogleSuccess: (profile: GoogleCredentialPayload) => void;
}

export const CustomerEmailAuthForm = ({
  phone,
  mode,
  onModeChange,
  onSuccess,
  onGoogleSuccess,
}: Props) => {
  const { signUpWithEmail, signInWithEmail } = useCustomerAuth();

  const [accountPhone, setAccountPhone] = useState(phone);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const needsPhoneInput = !validatePhoneNumber(accountPhone);

  useEffect(() => {
    setAccountPhone(phone);
  }, [phone]);

  const resolvePhone = (): string | null => {
    const value = validatePhoneNumber(accountPhone) ? accountPhone : phone;
    return validatePhoneNumber(value) ? value : null;
  };

  const switchMode = (next: AuthMode) => {
    onModeChange(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const resolved = resolvePhone();
    if (!resolved) {
      setError("Enter a valid phone number.");
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Enter your name.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      setLoading(true);
      const result = signUpWithEmail({ name, email, password, phone: resolved });
      setLoading(false);
      if (result.success) onSuccess();
      else setError(result.message);
      return;
    }

    setLoading(true);
    const result = signInWithEmail({ email, password, phone: resolved });
    setLoading(false);
    if (result.success) onSuccess();
    else setError(result.message);
  };

  return (
    <div className="space-y-4">
      <GoogleSignInButton
        onSuccess={onGoogleSuccess}
        text={mode === "signup" ? "signup_with" : "signin_with"}
        className="w-full"
      />

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <div className="flex rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === "signin" ? "bg-white text-neutral-900 shadow-sm" : "text-slate-600"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === "signup" ? "bg-white text-neutral-900 shadow-sm" : "text-slate-600"
          }`}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {needsPhoneInput && (
          <GhanaPhoneInput
            id="auth-phone"
            value={accountPhone}
            onChange={setAccountPhone}
            disabled={loading}
            className="rounded-xl border-slate-200 bg-slate-50/60 py-3"
          />
        )}

        {mode === "signup" && (
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="auth-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className="pl-9 rounded-xl"
              autoComplete="name"
            />
          </div>
        )}

        <div className="relative">
          <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            id="auth-email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="pl-9 rounded-xl"
            autoComplete="email"
          />
        </div>

        <div className="relative">
          <Input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "Password (6+ chars)" : "Password"}
            className="pr-10 rounded-xl"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </button>
        </div>

        {mode === "signup" && (
          <Input
            id="auth-confirm"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Confirm password"
            className="rounded-xl"
            autoComplete="new-password"
          />
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-[#ea690c] hover:bg-[#d45e0a] text-white rounded-xl font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Please wait…
            </>
          ) : mode === "signup" ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </div>
  );
};
