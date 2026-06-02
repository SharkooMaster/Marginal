import { Platform } from "react-native";

// Foreground display behaviour (native only). Guarded so web stays untouched.
async function ensureHandler() {
  if (Platform.OS === "web") return null;
  const Notifications = await import("expo-notifications");
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  return Notifications;
}

// Ask for permission and return the Expo push token, or null when unavailable
// (web, simulator, or permission denied).
export async function registerForPush() {
  if (Platform.OS === "web") return null;
  try {
    const Device = await import("expo-device");
    if (!Device.isDevice) return null;
    const Notifications = await ensureHandler();
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== "granted") {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== "granted") return null;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch (_) {
    return null;
  }
}
