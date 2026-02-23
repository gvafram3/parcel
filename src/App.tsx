import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StationProvider } from "./contexts/StationContext";
import { LocationProvider } from "./contexts/LocationContext";
import { UserProvider } from "./contexts/UserContext";
import { ParcelProvider } from "./contexts/ParcelContext";
import { FrontdeskParcelProvider } from "./contexts/FrontdeskParcelContext";
import { ShelfProvider } from "./contexts/ShelfContext";
import { ToastProvider } from "./components/ui/toast";
import { MainLayout } from "./layouts/MainLayout";
import { RiderLayout } from "./layouts/RiderLayout";
import { CallCenterLayout } from "./layouts/CallCenterLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./screens/Login";
import { ForgotPassword } from "./screens/ForgotPassword";
import { PasswordRequestSent } from "./screens/PasswordRequestSent";
import { ResetPassword } from "./screens/ResetPassword";
import { ParcelRegistration } from "./screens/ParcelRegistration";
import { PickupRequest } from "./screens/PickupRequest";
import { ParcelCostsAndPOD } from "./screens/ParcelCostsAndPOD";
import { ParcelReview } from "./screens/ParcelReview";
import { ParcelSMSSuccess } from "./screens/ParcelSMSSuccess";
import { ParcelSelection } from "./screens/ParcelSelection";
import { ParcelRiderSelection } from "./screens/ParcelRiderSelection";
import { ActiveDeliveries } from "./screens/ActiveDeliveries";
import { RiderDashboard } from "./screens/RiderDashboard";
import { RiderHistory } from "./screens/RiderHistory";
import { Reconciliation } from "./screens/Reconciliation";
import { ReconciliationConfirmation } from "./screens/ReconciliationConfirmation";
import { FinancialDashboard } from "./screens/FinancialDashboard/FinancialDashboard";
import { ShelfManagement } from "./screens/ShelfManagement/ShelfManagement";
import { CallCenter } from "./screens/CallCenter/CallCenter";
import { ParcelSearch } from "./screens/ParcelSearch/ParcelSearch";
import { ParcelEdit } from "./screens/ParcelEdit";
import { AdminDashboard } from "./screens/Admin/AdminDashboard/AdminDashboard";
import { StationManagement } from "./screens/Admin/StationManagement/StationManagement";
import { UserManagement } from "./screens/Admin/UserManagement/UserManagement";
import { SystemParcelOverview } from "./screens/Admin/SystemParcelOverview/SystemParcelOverview";
import { FinancialReports } from "./screens/Admin/FinancialReports/FinancialReports";
import { AdminReconciliation } from "./screens/Admin/AdminReconciliation/AdminReconciliation";
import { Preferences } from "./screens/Preferences/Preferences";
import { Help } from "./screens/Help/Help";

export const App = (): JSX.Element => {
  return (
    <StationProvider>
      <LocationProvider>
        <UserProvider>
          <ParcelProvider>
            <FrontdeskParcelProvider>
              <ShelfProvider>
                <ToastProvider>
                  <BrowserRouter>
                    <Routes>
                      {/* Auth Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/password-request-sent" element={<PasswordRequestSent />} />
                      <Route path="/reset-password" element={<ResetPassword />} />

                      {/* Root - Redirect to login */}
                      <Route path="/" element={<Navigate to="/login" replace />} />


                      <Route
                        path="/parcel-search"
                        element={
                          <ProtectedRoute allowedRoles={["FRONTDESK", "MANAGER", "ADMIN"]}>
                            <MainLayout>
                              <ParcelSearch />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/parcel-intake"
                        element={
                          <ProtectedRoute allowedRoles={["FRONTDESK", "MANAGER", "ADMIN"]}>
                            <MainLayout>
                              <ParcelRegistration />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/pickup-request"
                        element={
                          <ProtectedRoute allowedRoles={["FRONTDESK", "MANAGER", ]}>
                            <MainLayout>
                              <PickupRequest />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/call-center"
                        element={
                          <ProtectedRoute allowedRoles={["CALLER"]}>
                            <CallCenterLayout>
                              <CallCenter />
                            </CallCenterLayout>
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
                          <ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "FRONTDESK"]}>
                            <MainLayout>
                              <ParcelSelection />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/rider-selection"
                        element={
                          <ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "FRONTDESK"]}>
                            <MainLayout>
                              <ParcelRiderSelection />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/active-deliveries"
                        element={
                          <ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "FRONTDESK"]}>
                            <MainLayout>
                              <ActiveDeliveries />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/rider/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={["RIDER"]}>
                            <RiderLayout>
                              <RiderDashboard />
                            </RiderLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/rider/history"
                        element={
                          <ProtectedRoute allowedRoles={["RIDER"]}>
                            <RiderLayout>
                              <RiderHistory />
                            </RiderLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/reconciliation-history" element={<Navigate to="/reconciliation" replace />} />
                      <Route
                        path="/reconciliation"
                        element={
                          <ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "FRONTDESK"]}>
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
                          <ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "FRONTDESK"]}>
                            <MainLayout>
                              <FinancialDashboard />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/shelf-management"
                        element={
                          <ProtectedRoute allowedRoles={["MANAGER", "ADMIN", "FRONTDESK"]}>
                            <MainLayout>
                              <ShelfManagement />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/parcel-edit"
                        element={
                          <ProtectedRoute allowedRoles={["MANAGER", "FRONTDESK"]}>
                            <MainLayout>
                              <ParcelEdit />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />

                      {/* Admin Routes */}
                      <Route
                        path="/admin/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <MainLayout>
                              <AdminDashboard />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/stations"
                        element={
                          <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <MainLayout>
                              <StationManagement />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/users"
                        element={
                          <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <MainLayout>
                              <UserManagement />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/parcels"
                        element={
                          <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <MainLayout>
                              <SystemParcelOverview />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/reconciliation"
                        element={
                          <ProtectedRoute allowedRoles={["ADMIN"]}>
                            <MainLayout>
                              <AdminReconciliation />
                            </MainLayout>
                          </ProtectedRoute>
                        }
                      />

                      <Route
                        path="/admin/financial-reports"
                        element={
                          <ProtectedRoute allowedRoles={["ADMIN"]}>
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
                </ToastProvider>
              </ShelfProvider>
            </FrontdeskParcelProvider>
          </ParcelProvider>
        </UserProvider>
      </LocationProvider>
    </StationProvider>
  );
};

