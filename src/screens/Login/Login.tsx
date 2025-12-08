import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  PackageIcon,
  GiftIcon,
  MailIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";

export const Login = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Navigate to dashboard without authentication logic
    navigate("/parcel-intake");
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

            {/* Welcome Message */}
            <div className="text-center mb-6">
              <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)] mb-2">
                Welcome Back!
              </h1>
              <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)]">
                Kindly enter your Client ID and Password to login
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Username Field */}
              <div className="flex flex-col gap-2">
                <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                  Username<span className="text-[#e22420]">*</span>
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9a9a]" />
                  <Input
                    type="text"
                    placeholder="eg. Age7336"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10 w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                    Password<span className="text-[#e22420]">*</span>
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-[#ea690c] hover:underline text-sm font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9a9a]" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 w-full rounded border border-[#d1d1d1] bg-white px-3 py-2 [font-family:'Lato',Helvetica] font-normal text-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-neutral-800"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full bg-[#ea690c] text-white hover:bg-[#ea690c]/90 mt-2"
              >
                <span className="[font-family:'Lato',Helvetica] font-semibold text-sm">
                  Login
                </span>
                <ArrowRightIcon className="w-4 h-4" />
              </Button>
            </form>

            {/* Warning Message */}
            <p className="text-center text-neutral-600 text-xs mt-6">
              Warning: Unauthorized use of this system is prohibited and will be tracked. Violators will be subject to disciplinary and legal action.
            </p>

            {/* Version */}
            <p className="text-center text-[#9a9a9a] text-xs mt-4">
              Version 1.0.0
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

