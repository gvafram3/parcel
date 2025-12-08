import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  UserIcon,
  ArrowRightIcon,
  PackageIcon,
  GiftIcon,
  MailIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";

export const ForgotPassword = (): JSX.Element => {
  const [clientId, setClientId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to password request sent screen
    navigate("/password-request-sent");
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
              Please enter your username and contact a manager to complete the password reset process.
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                  Client ID<span className="text-[#e22420]">*</span>
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9a9a]" />
                  <Input
                    type="text"
                    placeholder="e. Age7336"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="pl-10 w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
              >
                <span className="[font-family:'Lato',Helvetica] font-semibold text-sm">
                  Submit
                </span>
                <ArrowRightIcon className="w-4 h-4" />
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

