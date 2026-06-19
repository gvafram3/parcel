import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "mnm_receive_pwa_install_dismissed";

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(max-width: 768px)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
  );
}

export function isStandaloneApp(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function usePwaInstall(enabled: boolean) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === "1");
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (!enabled || !isMobileDevice() || isStandaloneApp() || dismissed) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setDeferredPrompt(null);
      localStorage.setItem(DISMISS_KEY, "1");
      setDismissed(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [enabled, dismissed]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
    setDeferredPrompt(null);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice.outcome === "accepted") {
        localStorage.setItem(DISMISS_KEY, "1");
        setDismissed(true);
        return true;
      }
      return false;
    } finally {
      setInstalling(false);
    }
  }, [deferredPrompt]);

  const showIosHint = enabled && isMobileDevice() && !isStandaloneApp() && !dismissed && isIosDevice();
  const showInstallButton = enabled && isMobileDevice() && !isStandaloneApp() && !dismissed && deferredPrompt != null;
  const showBanner = showInstallButton || showIosHint;

  return {
    showBanner,
    showInstallButton,
    showIosHint,
    installing,
    install,
    dismiss,
  };
}
