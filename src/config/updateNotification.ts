/**
 * Update notification configuration
 *
 * Edit this file to control app-wide update notifications:
 *
 * - Set enabled to true to show the notification to users (each user sees it once per notificationId).
 * - Set enabled to false to stop showing the notification to everyone (including new users).
 * - Change notificationId when you publish a new message so users who already dismissed the previous one will see the new one.
 */

export const updateNotificationConfig = {
  /** Set to false to stop showing this notification to all users (current and future). */
  enabled: true,

  /**
   * Unique id for this notification. Change this when you publish new content
   * so users who had already dismissed the previous notification will see the new one.
   */
  notificationId: "parcel-intake-updates-2025",

  title: "What's new on Parcel Intake",

  /** Optional short intro line. */
  message: "We've updated the parcel intake form. Here's what changed:",

  /** Bullet points shown in the popup. */
  items: [
    "Home delivery — Turn on \"Home Delivery Requested\" to see and fill Receiver Address and Delivery Cost. Both are required when home delivery is on.",
    "Saved addresses — You can select from addresses you've added in Shelf and Address; the delivery cost fills in automatically.",
    "Save to address list — Turn this on to save the current address and cost to your list automatically when you save the parcel, so you can reuse them next time.",
  ],
} as const;
