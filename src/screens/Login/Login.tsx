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
  AlertCircleIcon,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { useStation } from "../../contexts/StationContext";
import { mockUsers, mockStations } from "../../data/mockData";

export const Login = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUser, setStation, isAuthenticated, userRole } = useStation();

  // Redirect if already authenticated
  if (isAuthenticated) {
    if (userRole === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (userRole === "rider") {
      navigate("/active-deliveries", { replace: true });
    } else if (userRole === "call-center") {
      navigate("/call-center", { replace: true });
    } else {
      navigate("/parcel-intake", { replace: true });
    }
    return <></>;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Find user by email (in production, this would be an API call)
    const user = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    // For now, accept any password (in production, verify password)
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    // Find user's station
    const station = mockStations.find((s) => s.id === user.stationId);

    if (!station) {
      setError("User station not found. Please contact administrator.");
      return;
    }

    // Set user and station in context
    setUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      stationId: user.stationId,
    });

    setStation({
      id: station.id,
      name: station.name,
      location: station.location,
    });

    // Redirect based on role
    if (user.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
    } else if (user.role === "rider") {
      navigate("/active-deliveries", { replace: true });
    } else if (user.role === "call-center") {
      navigate("/call-center", { replace: true });
    } else {
      navigate("/parcel-intake", { replace: true });
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

            {/* Welcome Message */}
            <div className="text-center mb-6">
              <h1 className="font-body-lg-semibold font-[number:var(--body-lg-semibold-font-weight)] text-neutral-800 text-[length:var(--body-lg-semibold-font-size)] mb-2">
                Welcome Back!
              </h1>
              <p className="font-body-md font-[number:var(--body-md-font-weight)] text-[#5d5d5d] text-[length:var(--body-md-font-size)]">
                Enter your email and password to login
              </p>
              <p className="text-xs text-[#9a9a9a] mt-2">
                Test users: admin@parcel.com, kwame@parcel.com, adams@parcel.com, grace@parcel.com, john.mensah@parcel.com
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Email Field */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                  Email<span className="text-[#e22420]">*</span>
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9a9a] pointer-events-none z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="eg. admin@parcel.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    required
                    className="pl-10 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c]"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                  Password<span className="text-[#e22420]">*</span>
                </Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9a9a] pointer-events-none z-10" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter any password (for testing)"
                    required
                    className="pl-10 pr-10 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-neutral-800 z-10"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-[#ea690c] hover:underline text-sm font-medium text-right mt-1"
                >
                  Forgot password?
                </Link>
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
