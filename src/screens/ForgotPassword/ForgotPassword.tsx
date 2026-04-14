import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowRightIcon,
  PackageIcon,
  GiftIcon,
  MailIcon,
  Loader,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import authService from "../../services/authService";
import { useToast } from "../../components/ui/toast";
import { normalizePhoneNumber, validatePhoneNumber } from "../../utils/dataHelpers";

export const ForgotPassword = (): JSX.Element => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handlePhoneChange = (input: string) => {
    const digits = input.replace(/\D/g, "").substring(0, 10);
    const normalized = normalizePhoneNumber(digits);
    setPhoneNumber(normalized);
    if (phoneError && validatePhoneNumber(normalized)) {
      setPhoneError("");
    }
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      setPhoneError("Invalid phone number format. Use 0XXXXXXXXX or XXXXXXXXX");
      setError("Invalid phone number format. Use 0XXXXXXXXX or XXXXXXXXX");
      setLoading(false);
      return;
    }

    try {
      const response = await authService.requestPasswordReset(phoneNumber);
      
      if (response.success) {
        showToast(response.message || "OTP sent successfully to your phone", "success");
        // Store verification ID if provided, or use phone number as identifier
        if (response.data?.verificationId) {
          sessionStorage.setItem('passwordResetVerificationId', response.data.verificationId);
        }
        sessionStorage.setItem('passwordResetPhone', phoneNumber);
        navigate("/reset-password");
      } else {
        setError(response.message);
        showToast(response.message, "error");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      showToast("An unexpected error occurred. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-orange-50 to-yellow-50 relative overflow-hidden">
      {/* Background Delivery Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 opacity-20">
          <PackageIcon className="w-32 h-32 text-orange-400" />
        </div>
        <div className="absolute top-40 right-20 opacity-15">
          <GiftIcon className="w-40 h-40 text-blue-400" />
        </div>
        <div className="absolute bottom-20 left-20 opacity-20">
          <MailIcon className="w-36 h-36 text-yellow-400" />
        </div>
        <div className="absolute bottom-40 right-10 opacity-15">
          <PackageIcon className="w-28 h-28 text-orange-500" />
        </div>
        <div className="absolute top-1/2 left-1/4 opacity-10">
          <GiftIcon className="w-24 h-24 text-blue-500" />
        </div>
        <div className="absolute top-1/3 right-1/3 opacity-15">
          <MailIcon className="w-30 h-30 text-yellow-500" />
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md rounded-2xl border border-[#d1d1d1] bg-white shadow-xl">
          <CardContent className="p-8">
            {/* Logo */}
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-12 h-12 bg-[#ea690c] rounded-lg flex items-center justify-center">
                  <PackageIcon className="w-8 h-8 text-white" />
                </div>
                <span className="text-[#ea690c] font-bold text-xl">DELIVERY</span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <span className="text-[#ea690c] font-bold text-2xl">Mealex & Mailex</span>
                  <span className="text-neutral-800 font-bold text-2xl">(M&M)</span>
                </div>
                <p className="text-neutral-600 text-sm">Parcel Delivery System</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)] text-center mb-4">
              Forgot Your Password?
            </h1>

            {/* Instructions */}
            <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)] text-center mb-6">
              Enter your phone number and we'll send you an OTP code to reset your password.
            </p>
            <p className="text-xs text-[#5d5d5d] text-center mb-4">
              Enter 9 digits (e.g., 24 XXX XXXX)
            </p>

            {/* Error Message */}
            {(error || phoneError) && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">{error || phoneError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                  Phone Number<span className="text-[#e22420]">*</span>
                </Label>
                 <div className="relative">
                     <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                       <span className="text-[#5d5d5d] font-medium text-sm">+233</span>
                     </div>
                     <Input
                       id="phone"
                       type="tel"
                       placeholder="0XXXXXXXXX or XXXXXXXXX"
                       value={phoneNumber.startsWith("+233") ? phoneNumber.substring(4) : phoneNumber}
                       onChange={(e) => handlePhoneChange(e.target.value)}
                       disabled={loading}
                       required
                       className="pl-12 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c] disabled:opacity-50 disabled:cursor-not-allowed"
                       maxLength={10}
                     />
                   </div>
                  <p className="text-xs text-[#5d5d5d] mt-1">
                    Enter 10 digits (e.g. 0550123456 or 550123456)
                  </p>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span className="[font-family:'Lato',Helvetica] font-semibold text-sm">
                      Sending OTP...
                    </span>
                  </>
                ) : (
                  <>
                    <span className="[font-family:'Lato',Helvetica] font-semibold text-sm">
                      Send OTP
                    </span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Return to Login Link */}
            <div className="text-center mt-6">
              <Link
                to="/login"
                className="text-[#ea690c] hover:underline text-sm font-medium"
              >
                Return to login?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

