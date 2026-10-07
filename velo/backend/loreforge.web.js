/* ============================================================
   LOREFORGE MEDIA UPLOADER  |  Wix Velo backend web module
   File location: backend/loreforge.web.js

   Stores rune snapshots and now any record image (FateWell
   covers for acts, sessions, scenes, NPCs) in the Media Manager.
   Reads the real mime type from the data URL so JPEG photos
   upload correctly, not only PNG runes. Returns the wix:image
   URL for the record, or "" on any problem so a media hiccup
   never blocks a save.
   ============================================================ */
import { Permissions, webMethod } from "wix-web-module";
import { mediaManager } from "wix-media-backend";

export const uploadRune = webMethod(
  Permissions.SiteMember,
  async (dataUrl, name) => {
    try {
      if (!dataUrl || typeof dataUrl !== "string") return "";

      // Read the mime type and payload from the data URL header.
      // Falls back to PNG if the header is missing.
      const match = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
      const mime = match ? match[1] : "image/png";
      const data = match ? match[2] : dataUrl.replace(/^data:image\/png;base64,/, "");

      // Roughly 8MB of base64, which covers a downscaled photo.
      if (data.length > 11000000) return "";

      const buffer = Buffer.from(data, "base64");

      const ext = mime === "image/jpeg" ? "jpg"
        : mime === "image/webp" ? "webp"
        : mime === "image/gif" ? "gif"
        : "png";

      const safe = String(name || "img")
        .replace(/[^a-zA-Z0-9 _-]/g, "").trim().slice(0, 40) || "img";

      const file = await mediaManager.upload(
        "/loreforge-runes",
        buffer,
        safe + "." + ext,
        { mediaOptions: { mimeType: mime, mediaType: "image" } }
      );
      return file.fileUrl || "";
    } catch (e) {
      return "";
    }
  }
);
