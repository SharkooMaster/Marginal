import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";

// Launch the gallery (works on web via file dialog and on native).
export async function pickFromLibrary() {
  if (Platform.OS !== "web") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error("Åtkomst till bilder nekades.");
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.7,
  });
  if (res.canceled) return null;
  return res.assets[0];
}

// Launch the camera (native only; web falls back to the library dialog).
export async function takePhoto() {
  if (Platform.OS === "web") return pickFromLibrary();
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error("Åtkomst till kameran nekades.");
  const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
  if (res.canceled) return null;
  return res.assets[0];
}

// Build a multipart FormData body for a picked asset, handling the web/native
// difference in how files are attached.
export async function buildPhotoForm(projectId, asset, { caption = "", checkIn, material } = {}) {
  const form = new FormData();
  form.append("project", String(projectId));
  if (caption) form.append("caption", caption);
  if (checkIn) form.append("check_in", String(checkIn));
  if (material) form.append("material", String(material));

  const name = asset.fileName || `foto-${Date.now()}.jpg`;
  const type = asset.mimeType || "image/jpeg";

  if (Platform.OS === "web") {
    const blob = await (await fetch(asset.uri)).blob();
    form.append("image", blob, name);
  } else {
    form.append("image", { uri: asset.uri, name, type });
  }
  return form;
}
