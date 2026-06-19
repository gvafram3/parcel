import { useEffect, useState } from "react";
import { useToast } from "../../components/ui/toast";
import { useCustomerAuth } from "../../contexts/CustomerAuthContext";
import { useStation } from "../../contexts/StationContext";
import { fetchOfficeNameMap, searchParcelsByPhone } from "../../services/customerService";
import { customerAuthService } from "../../services/customerAuthService";
import { validatePhoneNumber } from "../../utils/dataHelpers";
import { DeliveryRequestModal } from "./components/DeliveryRequestModal";
import { CustomerReceiveLanding, type LandingTab } from "./components/CustomerReceiveLanding";
import type { AuthMode } from "./components/CustomerEmailAuthForm";
import { LinkPhoneModal } from "./components/LinkPhoneModal";
import { OtpVerifyStep } from "./components/OtpVerifyStep";
import { ParcelDetailView, type ParcelActionSuccess } from "./components/ParcelDetailView";
import { ParcelListStep } from "./components/ParcelListStep";
import { ReceiveFooter } from "./components/ReceiveFooter";
import { TrackHeader } from "./components/TrackHeader";
import { preloadGoogleIdentity, type GoogleCredentialPayload } from "../../utils/googleAuth";
import { sendTrackOtp, verifyTrackOtp } from "./trackOtpMock";
import {
  EnrichedParcel,
  GpsCoordinates,
  TrackStep,
  DeliverySuccessInfo,
  DeliverySchedule,
  enrichParcel,
  formatDeliverySchedule,
  isParcelDeliverable,
  maskPhone,
} from "./trackParcelUtils";

const HEADER_SUBTITLES: Record<TrackStep, string> = {
  search: "Receive",
  otp: "Verify",
  list: "Parcels",
  detail: "Details",
};

export const CustomerParcelHub = (): JSX.Element => {
  const { showToast } = useToast();
  const { isAuthenticated } = useStation();
  const { isCustomerSignedIn, customer, signOutCustomer, completeGoogleSignIn } = useCustomerAuth();

  const [step, setStep] = useState<TrackStep>("search");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [parcels, setParcels] = useState<EnrichedParcel[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<EnrichedParcel | null>(null);
  const [deliveryParcels, setDeliveryParcels] = useState<EnrichedParcel[] | null>(null);
  const [pendingDeliveryParcels, setPendingDeliveryParcels] = useState<EnrichedParcel[] | null>(null);
  const [landingTab, setLandingTab] = useState<LandingTab>("account");
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [deliveryAuthPrompt, setDeliveryAuthPrompt] = useState(false);
  const [pendingGoogleProfile, setPendingGoogleProfile] = useState<GoogleCredentialPayload | null>(null);
  const [googleLinkLoading, setGoogleLinkLoading] = useState(false);
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<Set<string>>(new Set());
  const [actionSuccess, setActionSuccess] = useState<ParcelActionSuccess>(null);
  const [deliverySuccess, setDeliverySuccess] = useState<DeliverySuccessInfo>(null);
  const [officeNames, setOfficeNames] = useState<Record<string, string>>({});

  const [searchLoading, setSearchLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    preloadGoogleIdentity();
    fetchOfficeNameMap().then(setOfficeNames);

    import("virtual:pwa-register").then(({ registerSW }) => {
      registerSW({ immediate: true });
    });
  }, []);

  useEffect(() => {
    if (!Object.keys(officeNames).length) return;
    setParcels(prev => (prev.length ? prev.map(p => enrichParcel(p, officeNames)) : prev));
    setSelectedParcel(prev => (prev ? enrichParcel(prev, officeNames) : null));
  }, [officeNames]);

  useEffect(() => {
    if (customer?.phone && validatePhoneNumber(customer.phone) && !phone) {
      setPhone(customer.phone);
    }
  }, [customer, phone]);

  const focusAccountTab = (mode: AuthMode = "signin") => {
    setStep("search");
    setLandingTab("account");
    setAuthMode(mode);
  };

  const finishGoogleSignIn = (profile: GoogleCredentialPayload, linkedPhone: string) => {
    const result = completeGoogleSignIn({
      name: profile.name,
      email: profile.email,
      pictureUrl: profile.picture,
      phone: linkedPhone,
    });
    if (result.success) {
      setPhone(linkedPhone);
      setPendingGoogleProfile(null);
      return true;
    }
    showToast(result.message, "error");
    return false;
  };

  const handleGoogleSuccess = (profile: GoogleCredentialPayload) => {
    if (validatePhoneNumber(phone)) {
      if (finishGoogleSignIn(profile, phone)) {
        handleAuthSuccess();
      }
      return;
    }
    setPendingGoogleProfile(profile);
  };

  const handleLinkPhoneSubmit = (linkedPhone: string) => {
    if (!pendingGoogleProfile) return;
    setGoogleLinkLoading(true);
    if (finishGoogleSignIn(pendingGoogleProfile, linkedPhone)) {
      handleAuthSuccess();
    }
    setGoogleLinkLoading(false);
  };

  const resetAll = () => {
    setStep("search");
    setPhone("");
    setOtp("");
    setParcels([]);
    setSelectedParcel(null);
    setDeliveryParcels(null);
    setPendingDeliveryParcels(null);
    setDeliveryAuthPrompt(false);
    setLandingTab(isCustomerSignedIn ? "find" : "account");
    setSelectedDeliveryIds(new Set());
    setActionSuccess(null);
    setDeliverySuccess(null);
    setError("");
  };

  const toggleDeliverySelect = (parcelId: string) => {
    setSelectedDeliveryIds(prev => {
      const next = new Set(prev);
      if (next.has(parcelId)) next.delete(parcelId);
      else next.add(parcelId);
      return next;
    });
  };

  const selectAllDeliverable = () => {
    setSelectedDeliveryIds(new Set(parcels.filter(isParcelDeliverable).map(p => p.parcelId)));
  };

  const handleSearch = async () => {
    setError("");
    if (!validatePhoneNumber(phone)) {
      setError("Enter a valid Ghana phone number.");
      return;
    }

    setSearchLoading(true);
    try {
      const result = await searchParcelsByPhone(phone);
      if (!result.success || !result.data) {
        setError(result.message || "Search failed. Please try again.");
        return;
      }

      if (result.data.length === 0) {
        setError("No parcels found for this phone number.");
        return;
      }

      setParcels(result.data.map(p => enrichParcel(p, officeNames)));
      setOtp("");
      setOtpSending(true);
      const otpResult = await sendTrackOtp(phone);
      setOtpSending(false);

      if (!otpResult.success) {
        setError(otpResult.message);
        return;
      }

      showToast(otpResult.message, "success");
      setStep("otp");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSearchLoading(false);
      setOtpSending(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setOtpSending(true);
    const result = await sendTrackOtp(phone);
    setOtpSending(false);
    if (result.success) {
      showToast("New verification code sent.", "success");
    } else {
      setError(result.message);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setOtpLoading(true);
    try {
      const result = await verifyTrackOtp(phone, otp);
      if (!result.success) {
        setError(result.message);
        return;
      }
      showToast("Phone verified. You can now view your parcels.", "success");
      setStep("list");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSelfPickup = () => {
    setActionSuccess("pickup");
    showToast("Branch notified that you're on your way.", "success");
  };

  const handleDeliverySubmit = (
    coords: GpsCoordinates,
    notes: string,
    paystackReference: string,
    schedule: DeliverySchedule | null,
  ) => {
    const count = deliveryParcels?.length ?? 0;
    const scheduled = schedule != null;
    setDeliveryParcels(null);
    setSelectedDeliveryIds(new Set());
    setDeliverySuccess({
      parcelCount: count,
      paystackReference,
      scheduled,
      scheduledAt: schedule ? formatDeliverySchedule(schedule) : undefined,
    });
    if (step === "detail") setActionSuccess("delivery");

    showToast(
      scheduled
        ? `Scheduled delivery booked for ${count} parcel${count !== 1 ? "s" : ""} · payment received.`
        : `Payment successful · delivery requested for ${count} parcel${count !== 1 ? "s" : ""}.`,
      "success",
    );
    void coords;
    void notes;
  };

  const openDeliveryModal = (items: EnrichedParcel[]) => {
    if (items.length === 0) return;
    if (!isAuthenticated && !isCustomerSignedIn) {
      setPendingDeliveryParcels(items);
      setDeliveryAuthPrompt(true);
      setStep("search");
      setLandingTab("account");
      setAuthMode("signin");
      return;
    }
    setDeliveryParcels(items);
  };

  const handleAuthSuccess = () => {
    setDeliveryAuthPrompt(false);
    const session = customerAuthService.getSession();
    if (session?.phone && validatePhoneNumber(session.phone)) {
      setPhone(session.phone);
    }
    setLandingTab("find");
    if (pendingDeliveryParcels?.length) {
      setDeliveryParcels(pendingDeliveryParcels);
      setPendingDeliveryParcels(null);
      showToast("Signed in. Continue with delivery.", "success");
    } else {
      showToast("Welcome!", "success");
    }
  };

  const handleBack = () => {
    if (step === "detail") {
      setSelectedParcel(null);
      setActionSuccess(null);
      setDeliverySuccess(null);
      setStep("list");
      return;
    }
    if (step === "list" || step === "otp") {
      resetAll();
    }
  };

  const backLabel = step === "detail" ? "← All parcels" : "Back";

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 via-slate-50 to-slate-100 flex flex-col">
      <TrackHeader
        onBack={step !== "search" ? handleBack : undefined}
        backLabel={backLabel}
        subtitle={HEADER_SUBTITLES[step]}
        customerAccount={
          !isAuthenticated
            ? {
                isSignedIn: isCustomerSignedIn,
                name: customer?.name,
                pictureUrl: customer?.pictureUrl,
                onSignUp: () => focusAccountTab("signup"),
                onSignIn: () => focusAccountTab("signin"),
                onSignOut: () => {
                  signOutCustomer();
                  showToast("Signed out.", "info");
                },
              }
            : undefined
        }
      />

      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-6">
        {step === "search" && (
          <CustomerReceiveLanding
            phone={phone}
            loading={searchLoading}
            error={error}
            tab={landingTab}
            onTabChange={setLandingTab}
            authMode={authMode}
            onAuthModeChange={setAuthMode}
            isSignedIn={isCustomerSignedIn}
            customerName={customer?.name}
            customerEmail={customer?.email}
            customerPicture={customer?.pictureUrl}
            deliveryAuthPrompt={deliveryAuthPrompt}
            pendingDeliveryCount={pendingDeliveryParcels?.length}
            onPhoneChange={value => {
              setPhone(value);
              setError("");
            }}
            onSubmit={handleSearch}
            onGoogleSuccess={handleGoogleSuccess}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {step === "otp" && (
          <OtpVerifyStep
            phone={phone}
            parcelCount={parcels.length}
            loading={otpLoading}
            sending={otpSending}
            error={error}
            otp={otp}
            onOtpChange={value => {
              setOtp(value);
              setError("");
            }}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
          />
        )}

        {step === "list" && (
          <>
            {deliverySuccess && (
              <div className="mb-4 rounded-2xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                <p className="font-semibold text-blue-900">
                  {deliverySuccess.scheduled ? "Scheduled delivery booked & paid" : "Delivery requested & paid"}
                </p>
                <p className="mt-1">
                  {deliverySuccess.parcelCount} parcel{deliverySuccess.parcelCount !== 1 ? "s" : ""} will be delivered
                  together.
                  {deliverySuccess.scheduled && deliverySuccess.scheduledAt && (
                    <> Preferred: <span className="font-medium">{deliverySuccess.scheduledAt}</span></>
                  )}
                  {deliverySuccess.paystackReference && (
                    <> · Ref: <span className="font-mono text-xs">{deliverySuccess.paystackReference}</span></>
                  )}
                </p>
              </div>
            )}
            <ParcelListStep
              phone={maskPhone(phone)}
              parcels={parcels}
              selectedIds={selectedDeliveryIds}
              onToggleSelect={toggleDeliverySelect}
              onSelectAllDeliverable={selectAllDeliverable}
              onClearSelection={() => setSelectedDeliveryIds(new Set())}
              onSelect={parcel => {
                setSelectedParcel(parcel);
                setActionSuccess(null);
                setDeliverySuccess(null);
                setStep("detail");
              }}
              onRequestDelivery={openDeliveryModal}
              onNewSearch={resetAll}
            />
            <ReceiveFooter />
          </>
        )}

        {step === "detail" && selectedParcel && (
          <ParcelDetailView
            parcel={selectedParcel}
            actionSuccess={actionSuccess}
            deliverySuccess={deliverySuccess}
            onSelfPickup={handleSelfPickup}
            onRequestDelivery={() => openDeliveryModal([selectedParcel])}
          />
        )}
      </main>

      {pendingGoogleProfile && (
        <LinkPhoneModal
          profile={pendingGoogleProfile}
          loading={googleLinkLoading}
          onClose={() => setPendingGoogleProfile(null)}
          onSubmit={handleLinkPhoneSubmit}
        />
      )}

      {deliveryParcels && deliveryParcels.length > 0 && (
        <DeliveryRequestModal
          parcels={deliveryParcels}
          customerPhone={phone}
          customerEmail={customer?.email}
          onClose={() => setDeliveryParcels(null)}
          onSubmit={handleDeliverySubmit}
        />
      )}
    </div>
  );
};
