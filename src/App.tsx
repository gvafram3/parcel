import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
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

export const App = (): JSX.Element => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-request-sent" element={<PasswordRequestSent />} />

        <Route
          path="/"
          element={
            <MainLayout>
              <Navigate to="/parcel-intake" replace />
            </MainLayout>
          }
        />

        <Route
          path="/parcel-intake"
          element={
            <MainLayout>
              <ParcelRegistration />
            </MainLayout>
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
            <MainLayout>
              <ParcelSelection />
            </MainLayout>
          }
        />
        <Route
          path="/rider-selection"
          element={
            <MainLayout>
              <ParcelRiderSelection />
            </MainLayout>
          }
        />
        <Route
          path="/active-deliveries"
          element={
            <MainLayout>
              <ActiveDeliveries />
            </MainLayout>
          }
        />
        <Route
          path="/reconciliation"
          element={
            <MainLayout>
              <Reconciliation />
            </MainLayout>
          }
        />
        <Route
          path="/reconciliation-confirmation"
          element={
            <MainLayout>
              <ReconciliationConfirmation />
            </MainLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

