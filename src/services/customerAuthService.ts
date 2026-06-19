/**
 * Lightweight customer account for the public /receive flow.
 * Persists locally until a dedicated customer auth API is available.
 */

export type CustomerAuthProvider = "google" | "email";

export interface CustomerAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  provider: CustomerAuthProvider;
  pictureUrl?: string;
  /** Only stored for email provider (local dev accounts). */
  password?: string;
  createdAt: number;
}

const SESSION_KEY = "customer_session";
const ACCOUNTS_KEY = "customer_accounts";

function readAccounts(): CustomerAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as CustomerAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(accounts: CustomerAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function saveSession(account: CustomerAccount): CustomerAccount {
  const { password: _, ...session } = account;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function newId(): string {
  return `cust_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const customerAuthService = {
  getSession(): CustomerAccount | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as CustomerAccount) : null;
    } catch {
      return null;
    }
  },

  isSignedIn(): boolean {
    return this.getSession() != null;
  },

  signOut(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  signInWithGoogle(profile: {
    name: string;
    email: string;
    pictureUrl?: string;
    phone: string;
  }): { success: boolean; message: string; customer?: CustomerAccount } {
    const email = normalizeEmail(profile.email);
    if (!email) {
      return { success: false, message: "Google did not return an email address." };
    }

    const accounts = readAccounts();
    let account = accounts.find(a => normalizeEmail(a.email) === email);

    if (account) {
      account = {
        ...account,
        name: profile.name || account.name,
        phone: profile.phone || account.phone,
        pictureUrl: profile.pictureUrl ?? account.pictureUrl,
        provider: "google",
      };
      const idx = accounts.findIndex(a => a.id === account!.id);
      accounts[idx] = account;
    } else {
      account = {
        id: newId(),
        name: profile.name.trim() || email.split("@")[0],
        email,
        phone: profile.phone,
        provider: "google",
        pictureUrl: profile.pictureUrl,
        createdAt: Date.now(),
      };
      accounts.push(account);
    }

    writeAccounts(accounts);
    const session = saveSession(account);
    return { success: true, message: "Signed in with Google.", customer: session };
  },

  signUpWithEmail(params: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }): { success: boolean; message: string; customer?: CustomerAccount } {
    const name = params.name.trim();
    const email = normalizeEmail(params.email);
    const password = params.password;
    const phone = params.phone.trim();

    if (!name) return { success: false, message: "Enter your full name." };
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, message: "Enter a valid email address." };
    }
    if (password.length < 6) {
      return { success: false, message: "Password must be at least 6 characters." };
    }

    const accounts = readAccounts();
    if (accounts.some(a => normalizeEmail(a.email) === email)) {
      return { success: false, message: "An account with this email already exists. Sign in instead." };
    }

    const account: CustomerAccount = {
      id: newId(),
      name,
      email,
      phone,
      provider: "email",
      password,
      createdAt: Date.now(),
    };

    accounts.push(account);
    writeAccounts(accounts);
    const session = saveSession(account);
    return { success: true, message: "Account created.", customer: session };
  },

  signInWithEmail(params: {
    email: string;
    password: string;
    phone: string;
  }): { success: boolean; message: string; customer?: CustomerAccount } {
    const email = normalizeEmail(params.email);
    const accounts = readAccounts();
    const account = accounts.find(
      a => normalizeEmail(a.email) === email && a.provider === "email" && a.password === params.password,
    );

    if (!account) {
      return { success: false, message: "Invalid email or password." };
    }

    const updated = { ...account, phone: params.phone || account.phone };
    const idx = accounts.findIndex(a => a.id === account.id);
    accounts[idx] = updated;
    writeAccounts(accounts);

    const session = saveSession(updated);
    return { success: true, message: "Signed in.", customer: session };
  },
};
