import { useState, useEffect } from "react";
import { updateNotificationConfig } from "../config/updateNotification";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const STORAGE_KEY_PREFIX = "app_update_notification_seen_";

export const UpdateNotificationPopup = (): JSX.Element | null => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!updateNotificationConfig.enabled) {
      setShow(false);
      return;
    }
    const key = `${STORAGE_KEY_PREFIX}${updateNotificationConfig.notificationId}`;
    const seen = localStorage.getItem(key) === "true";
    setShow(!seen);
  }, []);

  const handleDismiss = () => {
    const key = `${STORAGE_KEY_PREFIX}${updateNotificationConfig.notificationId}`;
    localStorage.setItem(key, "true");
    setShow(false);
  };

  if (!updateNotificationConfig.enabled || !show) {
    return null;
  }

  const { title, message, items } = updateNotificationConfig;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <Card className="w-full max-w-lg rounded-xl border border-[#d1d1d1] bg-white shadow-xl">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-neutral-800 mb-2">{title}</h3>
            {message && (
              <p className="text-sm text-neutral-700 mb-3">{message}</p>
            )}
            {items.length > 0 && (
              <ul className="text-sm text-neutral-700 space-y-2 list-disc list-inside">
                {items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            )}
          </div>
          <Button
            onClick={handleDismiss}
            className="w-full bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
          >
            Okay
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
