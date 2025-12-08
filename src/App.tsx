import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-request-sent" element={<PasswordRequestSent />} />
        <Route path="/parcel-intake" element={<ParcelRegistration />} />
        <Route path="/parcel-costs-pod" element={<ParcelCostsAndPOD />} />
        <Route path="/parcel-review" element={<ParcelReview />} />
        <Route path="/parcel-sms-success" element={<ParcelSMSSuccess />} />
        <Route path="/package-assignments" element={<ParcelSelection />} />
        <Route path="/rider-selection" element={<ParcelRiderSelection />} />
        <Route path="/active-deliveries" element={<ActiveDeliveries />} />
        <Route path="/reconciliation" element={<Reconciliation />} />
        <Route path="/reconciliation-confirmation" element={<ReconciliationConfirmation />} />
      </Routes>
    </BrowserRouter>
  );
};

