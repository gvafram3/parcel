import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  PackageIcon,
  GiftIcon,
  MailIcon,
} from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";

export const PasswordRequestSent = (): JSX.Element => {
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

            {/* Success Message */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)]">
                  Password Request Sent.
                </h1>
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)]">
                Your password reset request has been logged. Please remain at this terminal and alert a manager.
              </p>
            </div>

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

