/**
 * Google Identity Services (Sign in with Google) for customer quick sign-up.
 */

export interface GoogleCredentialPayload {
  name: string;
  email: string;
  picture?: string;
}

export type GoogleButtonText = "signin_with" | "signup_with" | "continue_with";

interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          type?: string;
          theme?: string;
          size?: string;
          text?: string;
          width?: number;
          shape?: string;
          logo_alignment?: string;
        },
      ) => void;
      prompt: () => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdApi;
  }
}

let scriptPromise: Promise<void> | null = null;
let initializedClientId: string | null = null;

function loadGoogleIdentityScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Sign-In."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

function decodeJwtPayload(credential: string): GoogleCredentialPayload | null {
  try {
    const payload = credential.split(".")[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const data = JSON.parse(json) as {
      name?: string;
      email?: string;
      picture?: string;
    };
    if (!data.email) return null;
    return {
      name: data.name || data.email.split("@")[0],
      email: data.email,
      picture: data.picture,
    };
  } catch {
    return null;
  }
}

export function getGoogleOAuthClientId(): string {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getGoogleOAuthClientId());
}

/** Preload GIS script early so the button appears faster on the landing page. */
export function preloadGoogleIdentity(): void {
  if (!isGoogleSignInConfigured()) return;
  void loadGoogleIdentityScript();
}

async function ensureGoogleIdentity(
  clientId: string,
  onCredential: (profile: GoogleCredentialPayload) => void,
  onError?: (message: string) => void,
): Promise<void> {
  await loadGoogleIdentityScript();

  if (initializedClientId !== clientId) {
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: response => {
        const profile = decodeJwtPayload(response.credential);
        if (!profile) {
          onError?.("Could not read your Google profile. Try email sign-up.");
          return;
        }
        onCredential(profile);
      },
      cancel_on_tap_outside: true,
    });
    initializedClientId = clientId;
  }
}

export async function mountGoogleSignInButton(
  container: HTMLElement,
  options: {
    onSuccess: (profile: GoogleCredentialPayload) => void;
    onError?: (message: string) => void;
    text?: GoogleButtonText;
    width?: number;
  },
): Promise<boolean> {
  const clientId = getGoogleOAuthClientId();
  if (!clientId) {
    options.onError?.("Google sign-in is not configured.");
    return false;
  }

  await ensureGoogleIdentity(clientId, options.onSuccess, options.onError);

  container.innerHTML = "";
  const width = options.width ?? Math.min(400, container.offsetWidth || 320);

  window.google!.accounts.id.renderButton(container, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: options.text ?? "continue_with",
    shape: "rectangular",
    logo_alignment: "left",
    width,
  });

  return true;
}

export async function renderGoogleSignInButton(
  container: HTMLElement,
  onSuccess: (profile: GoogleCredentialPayload) => void,
  onError?: (message: string) => void,
): Promise<void> {
  await mountGoogleSignInButton(container, { onSuccess, onError, text: "signup_with" });
}
