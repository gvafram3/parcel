/**
 * Paystack inline checkout for customer delivery payments.
 */

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => { openIframe: () => void };
    };
  }
}

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: Record<string, unknown>;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
}

let scriptPromise: Promise<void> | null = null;

export function getPaystackPublicKey(): string {
  return import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";
}

function loadPaystackScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack."));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export function buildPaystackReference(): string {
  return `MNM-DLV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function paystackEmailFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `customer+${digits || "guest"}@mnm-delivery.local`;
}

export async function openPaystackPayment(params: {
  email: string;
  amountGhc: number;
  reference: string;
  metadata?: Record<string, unknown>;
  onSuccess: (reference: string) => void;
  onCancel?: () => void;
}): Promise<void> {
  const key = getPaystackPublicKey();
  if (!key) {
    throw new Error("Paystack is not configured. Add VITE_PAYSTACK_PUBLIC_KEY to your environment.");
  }

  const amountPesewas = Math.max(100, Math.round(params.amountGhc * 100));

  await loadPaystackScript();

  const handler = window.PaystackPop!.setup({
    key,
    email: params.email,
    amount: amountPesewas,
    currency: "GHS",
    ref: params.reference,
    metadata: params.metadata,
    callback: response => params.onSuccess(response.reference),
    onClose: () => params.onCancel?.(),
  });

  handler.openIframe();
}
