import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  type GoogleButtonText,
  type GoogleCredentialPayload,
  isGoogleSignInConfigured,
  mountGoogleSignInButton,
} from "../../../utils/googleAuth";

const GOOGLE_LABELS: Record<GoogleButtonText, string> = {
  continue_with: "Continue with Google",
  signup_with: "Sign up with Google",
  signin_with: "Sign in with Google",
};

export const GoogleLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

interface FallbackProps {
  text: GoogleButtonText;
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

export const GoogleSignInFallbackButton = ({ text, disabled, loading, onClick }: FallbackProps) => (
  <button
    type="button"
    disabled={disabled || loading}
    onClick={onClick}
    className="w-full h-11 inline-flex items-center justify-center gap-3 rounded-lg border border-[#dadce0] bg-white text-[#3c4043] text-sm font-medium shadow-sm hover:bg-[#f8f9fa] hover:shadow transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
  >
    {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <GoogleLogo />}
    <span>{GOOGLE_LABELS[text]}</span>
  </button>
);

interface Props {
  onSuccess: (profile: GoogleCredentialPayload) => void;
  onError?: (message: string) => void;
  text?: GoogleButtonText;
  className?: string;
}

export const GoogleSignInButton = ({ onSuccess, onError, text = "continue_with", className = "" }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const configured = isGoogleSignInConfigured();
  const [loading, setLoading] = useState(configured);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState("");
  const [fallbackNotice, setFallbackNotice] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !configured) {
      setLoading(false);
      setMounted(false);
      return;
    }

    let cancelled = false;

    const mount = () => {
      if (cancelled || !containerRef.current) return;
      const width = containerRef.current.offsetWidth || 320;
      void mountGoogleSignInButton(containerRef.current, {
        text,
        width: Math.min(400, width),
        onSuccess: profile => {
          if (!cancelled) onSuccess(profile);
        },
        onError: message => {
          if (!cancelled) {
            setError(message);
            onError?.(message);
          }
        },
      })
        .then(ok => {
          if (!cancelled) {
            setMounted(ok);
            setLoading(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMounted(false);
            setLoading(false);
          }
        });
    };

    setLoading(true);
    mount();

    return () => {
      cancelled = true;
    };
  }, [configured, onSuccess, onError, text]);

  const handleUnconfiguredClick = () => {
    const message = "Google sign-in not configured yet.";
    setFallbackNotice(message);
    onError?.(message);
  };

  if (!configured) {
    return (
      <div className={className}>
        <GoogleSignInFallbackButton text={text} onClick={handleUnconfiguredClick} />
        {fallbackNotice && (
          <p className="text-xs text-center text-amber-800 bg-amber-50/90 border border-amber-200 rounded-lg px-3 py-2 mt-2">
            {fallbackNotice}
          </p>
        )}
      </div>
    );
  }

  const showFallback = loading || !mounted;

  return (
    <div className={className}>
      {showFallback && (
        <GoogleSignInFallbackButton text={text} loading={loading} disabled />
      )}
      <div
        ref={containerRef}
        className={`flex justify-center min-h-[44px] w-full [&>div]:w-full [&_iframe]:!w-full ${showFallback ? "sr-only h-0 min-h-0 overflow-hidden" : ""}`}
      />
      {error && (
        <p className="text-xs text-center text-amber-800 bg-amber-50/90 border border-amber-200 rounded-lg px-3 py-2 mt-2">
          {error}
        </p>
      )}
    </div>
  );
};
