import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  customerAuthService,
  type CustomerAccount,
} from "../services/customerAuthService";

interface CustomerAuthContextValue {
  customer: CustomerAccount | null;
  isCustomerSignedIn: boolean;
  refreshCustomer: () => void;
  signOutCustomer: () => void;
  completeGoogleSignIn: (profile: {
    name: string;
    email: string;
    pictureUrl?: string;
    phone: string;
  }) => { success: boolean; message: string };
  signUpWithEmail: (params: {
    name: string;
    email: string;
    password: string;
    phone: string;
  }) => { success: boolean; message: string };
  signInWithEmail: (params: {
    email: string;
    password: string;
    phone: string;
  }) => { success: boolean; message: string };
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerAccount | null>(() => customerAuthService.getSession());

  const refreshCustomer = useCallback(() => {
    setCustomer(customerAuthService.getSession());
  }, []);

  const signOutCustomer = useCallback(() => {
    customerAuthService.signOut();
    setCustomer(null);
  }, []);

  const completeGoogleSignIn = useCallback(
    (profile: { name: string; email: string; pictureUrl?: string; phone: string }) => {
      const result = customerAuthService.signInWithGoogle(profile);
      if (result.success && result.customer) setCustomer(result.customer);
      return { success: result.success, message: result.message };
    },
    [],
  );

  const signUpWithEmail = useCallback(
    (params: { name: string; email: string; password: string; phone: string }) => {
      const result = customerAuthService.signUpWithEmail(params);
      if (result.success && result.customer) setCustomer(result.customer);
      return { success: result.success, message: result.message };
    },
    [],
  );

  const signInWithEmail = useCallback(
    (params: { email: string; password: string; phone: string }) => {
      const result = customerAuthService.signInWithEmail(params);
      if (result.success && result.customer) setCustomer(result.customer);
      return { success: result.success, message: result.message };
    },
    [],
  );

  const value = useMemo(
    () => ({
      customer,
      isCustomerSignedIn: customer != null,
      refreshCustomer,
      signOutCustomer,
      completeGoogleSignIn,
      signUpWithEmail,
      signInWithEmail,
    }),
    [customer, refreshCustomer, signOutCustomer, completeGoogleSignIn, signUpWithEmail, signInWithEmail],
  );

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
};

export const useCustomerAuth = (): CustomerAuthContextValue => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  }
  return ctx;
};
