import { useState, useEffect } from "react";
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
  Loader,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { useStation } from "../../contexts/StationContext";
import authService from "../../services/authService";

export const Login = (): JSX.Element => {
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState<"email" | "phone">("phone");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { setUser, setStation, isAuthenticated, userRole } = useStation();

  // Redirect if already authenticated
  useEffect(() => {
    console.log("Checking authentication - isAuthenticated:", isAuthenticated, "userRole:", userRole);
    if (isAuthenticated && userRole) {
      console.log("User is authenticated with role:", userRole);

      // Small delay to ensure state is properly updated
      const timer = setTimeout(() => {
        if (userRole === "ADMIN") {
          console.log("Redirecting to admin dashboard");
          navigate("/admin/stations", { replace: true });
          return;
        } else if (userRole === "RIDER") {
          navigate("/rider/dashboard", { replace: true });
        } else if (userRole === "CALLER") {
          navigate("/call-center", { replace: true });
        } else {
          navigate("/parcel-search", { replace: true });
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, userRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;

      if (loginType === "email") {
        if (!email.trim()) {
          setError("Email is required.");
          setLoading(false);
          return;
        }
        response = await authService.loginWithEmail(email, password);
      } else {
        if (!phoneNumber.trim()) {
          setError("Phone number is required.");
          setLoading(false);
          return;
        }
        response = await authService.loginWithPhone(phoneNumber, password);
      }
      console.log("Login response:", response);

      if (!response.success) {
        setError(response.message);
        setLoading(false);
        return;
      }

      if (response.data) {
        const userData = response.data.user;
        // Normalize role - handle both old and new role formats
        let normalizedRole = userData.role?.toUpperCase() || "FRONTDESK";
        // Map old role names to new ones
        if (normalizedRole === 'STATION-MANAGER') normalizedRole = 'MANAGER';
        if (normalizedRole === 'FRONT-DESK') normalizedRole = 'FRONTDESK';
        if (normalizedRole === 'CALL-CENTER') normalizedRole = 'CALLER';

        console.log("Setting user with role:", normalizedRole);

        // Set user in context
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: normalizedRole as any,
          stationId: userData.stationId, // Will be undefined for admin
        });

        // Set station only if user has a stationId (not admin)
        if (userData.stationId) {
          setStation({
            id: userData.stationId,
            name: `Station ${userData.stationId}`,
            location: "Location",
          });
        } else {
          // Admin user - no station
          setStation(null);
        }

        // Store remember me preference
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("loginType", loginType);
          if (loginType === "email") {
            localStorage.setItem("rememberedEmail", email);
          } else {
            localStorage.setItem("rememberedPhone", phoneNumber);
          }
        }

        // Redirect based on role - do it directly instead of waiting for context update
        console.log("Redirecting with role:", normalizedRole);
        setTimeout(() => {
          console.log("Navigating based on role:", normalizedRole);
          if (normalizedRole === "ADMIN") {
            console.log("Navigate to admin dashboard");
            navigate("/admin/stations", { replace: true });
          } else if (normalizedRole === "RIDER") {
            navigate("/rider/dashboard", { replace: true });
          } else if (normalizedRole === "CALLER") {
            navigate("/call-center", { replace: true });
          } else {
            navigate("/parcel-search", { replace: true });
          }
        }, 500);
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load remembered credentials
  useEffect(() => {
    const rememberMe = localStorage.getItem("rememberMe") === "true";
    if (rememberMe) {
      const savedLoginType = localStorage.getItem("loginType") as "email" | "phone" | null;
      if (savedLoginType === "email") {
        const savedEmail = localStorage.getItem("rememberedEmail");
        if (savedEmail) {
          setEmail(savedEmail);
          setLoginType("email");
        }
      } else if (savedLoginType === "phone") {
        const savedPhone = localStorage.getItem("rememberedPhone");
        if (savedPhone) {
          setPhoneNumber(savedPhone);
          setLoginType("phone");
        }
      }
      setRememberMe(true);
    }
  }, []);

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
                {/* <span className="text-[#ea690c] font-bold text-xl">DELIVERY</span> */}
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
                Enter your credentials to login
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
              {/* Email/Phone Field */}
              {loginType === "email" ? (
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
                      disabled={loading}
                      required
                      className="pl-10 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone" className="[font-family:'Lato',Helvetica] font-semibold text-neutral-800 text-sm">
                    Phone Number<span className="text-[#e22420]">*</span>
                  </Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9a9a9a] pointer-events-none z-10" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+233550566516"
                      value={phoneNumber}
                      onChange={(e) => {
                        setPhoneNumber(e.target.value);
                        setError("");
                      }}
                      disabled={loading}
                      required
                      className="pl-10 pr-3 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>
              )}

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
                    disabled={loading}
                    placeholder="Enter your password"
                    required
                    className="pl-10 pr-10 w-full rounded-lg border border-[#d1d1d1] bg-white py-2.5 [font-family:'Lato',Helvetica] font-normal text-neutral-700 placeholder:text-[#b0b0b0] focus:outline-none focus:ring-2 focus:ring-[#ea690c] focus:border-[#ea690c] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-neutral-800 z-10 disabled:opacity-50"
                    tabIndex={-1}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#d1d1d1] text-[#ea690c] focus:ring-[#ea690c]"
                  />
                  <span className="text-sm text-[#5d5d5d]">Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[#ea690c] hover:underline text-sm font-medium"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#ea690c] text-white hover:bg-[#ea690c]/90 mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <span className="[font-family:'Lato',Helvetica] font-semibold text-sm">
                      Login
                    </span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Version */}
            <p className="text-center text-[#9a9a9a] text-xs mt-4">
              Version 1.0.0 
              {/* | Secure API Integration */}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
