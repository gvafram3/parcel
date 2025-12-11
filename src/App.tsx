import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StationProvider } from "./contexts/StationContext";
import { MainLayout } from "./layouts/MainLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./screens/Login";
import { ForgotPassword } from "./screens/ForgotPassword";
import { PasswordRequestSent } from "./screens/PasswordRequestSent";
import { ParcelRegistration } from "./screens/ParcelRegistration";
import { ParcelCostsAndPOD } from "./screens/ParcelCostsAndPOD";
import { ParcelReview } from "./screens/ParcelReview";
import { ParcelSMSSuccess } from "./screens/ParcelSMSSuccess";
import { ParcelSelection } from "./screens/ParcelSelection";
import { ParcelRiderSelection } from "./screens/ParcelRiderSelection";
import { ActiveDeliveries } from "./screens/ActiveDeliveries";
import { Reconciliation } from "./screens/Reconciliation";
import { ReconciliationConfirmation } from "./screens/ReconciliationConfirmation";
import { FinancialDashboard } from "./screens/FinancialDashboard/FinancialDashboard";
import { ShelfManagement } from "./screens/ShelfManagement/ShelfManagement";
import { CallCenter } from "./screens/CallCenter/CallCenter";
import { ParcelSearch } from "./screens/ParcelSearch/ParcelSearch";
import { AdminDashboard } from "./screens/Admin/AdminDashboard/AdminDashboard";
import { StationManagement } from "./screens/Admin/StationManagement/StationManagement";
import { UserManagement } from "./screens/Admin/UserManagement/UserManagement";
import { SystemParcelOverview } from "./screens/Admin/SystemParcelOverview/SystemParcelOverview";
import { FinancialReports } from "./screens/Admin/FinancialReports/FinancialReports";
import { Preferences } from "./screens/Preferences/Preferences";
import { Help } from "./screens/Help/Help";

export const App = (): JSX.Element => {
  return (
    <StationProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/password-request-sent" element={<PasswordRequestSent />} />

          {/* Root - Redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route
            path="/parcel-intake"
            element={
              <ProtectedRoute allowedRoles={["front-desk", "station-manager", "admin"]}>
                <MainLayout>
                  <ParcelRegistration />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parcel-search"
            element={
              <ProtectedRoute allowedRoles={["front-desk", "station-manager", "admin", "call-center"]}>
                <MainLayout>
                  <ParcelSearch />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/call-center"
            element={
              <ProtectedRoute allowedRoles={["call-center", "station-manager", "admin", "front-desk"]}>
                <MainLayout>
                  <CallCenter />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/parcel-costs-pod"
            element={
              <MainLayout>
                <ParcelCostsAndPOD />
              </MainLayout>
            }
          />
          <Route
            path="/parcel-review"
            element={
              <MainLayout>
                <ParcelReview />
              </MainLayout>
            }
          />
          <Route
            path="/parcel-sms-success"
            element={
              <MainLayout>
                <ParcelSMSSuccess />
              </MainLayout>
            }
          />
          <Route
            path="/package-assignments"
            element={
              <ProtectedRoute allowedRoles={["station-manager", "admin", "front-desk"]}>
                <MainLayout>
                  <ParcelSelection />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/rider-selection"
            element={
              <ProtectedRoute allowedRoles={["station-manager", "admin", "front-desk"]}>
                <MainLayout>
                  <ParcelRiderSelection />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/active-deliveries"
            element={
              <ProtectedRoute allowedRoles={["rider", "station-manager", "admin", "front-desk"]}>
                <MainLayout>
                  <ActiveDeliveries />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reconciliation"
            element={
              <ProtectedRoute allowedRoles={["call-center", "station-manager", "admin", "front-desk"]}>
                <MainLayout>
                  <Reconciliation />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reconciliation-confirmation"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ReconciliationConfirmation />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/financial-dashboard"
            element={
              <ProtectedRoute allowedRoles={["station-manager", "admin", "front-desk"]}>
                <MainLayout>
                  <FinancialDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shelf-management"
            element={
              <ProtectedRoute allowedRoles={["station-manager", "admin", "front-desk"]}>
                <MainLayout>
                  <ShelfManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/stations"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MainLayout>
                  <StationManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MainLayout>
                  <UserManagement />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/parcels"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MainLayout>
                  <SystemParcelOverview />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/financial-reports"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <MainLayout>
                  <FinancialReports />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Preferences />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/help"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Help />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </StationProvider>
  );
};

