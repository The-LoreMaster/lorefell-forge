/* =====================================================================
   LoreFell - backend/portraits.web.js
   In the Wix editor code sidebar: Backend section -> add a new
   .web.js file named portraits.web.js and paste this in.

   Takes the small base64 JPEG the sheet captures, stores it in the
   Media Manager, and returns both URL forms:
   - fileUrl (wix:image://...) for the Characters portrait Image field
   - displayUrl (https://static.wixstatic.com/...) for <img> tags
     inside the sheet iframe
===================================================================== */

import { Permissions, webMethod } from 'wix-web-module';
import { mediaManager } from 'wix-media-backend';

export const uploadPortrait = webMethod(
  Permissions.SiteMember, // members only; matches the sheet pages
  async (base64DataUrl, characterName) => {
    if (typeof base64DataUrl !== 'string' || !base64DataUrl.startsWith('data:image/')) {
      throw new Error('Not an image payload');
    }
    /* Hard cap: the sheet sends ~256px JPEGs (tens of KB). Reject anything
       suspiciously large before buffering it. */
    if (base64DataUrl.length > 600000) {
      throw new Error('Portrait payload too large');
    }

    const base64 = base64DataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    const safeName = String(characterName || 'fell')
      .replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 40) || 'fell';

    const fileInfo = await mediaManager.upload(
      '/lorefell-portraits',
      buffer,
      `${safeName}-${Date.now()}.jpg`,
      {
        mediaOptions: { mimeType: 'image/jpeg', mediaType: 'image' },
        metadataOptions: { isPrivate: false, isVisitorUpload: false }
      }
    );

    /* fileInfo.fileUrl: wix:image://v1/<mediaId>/<fileName>#originWidth=...
       The https form embeds anywhere, including inside the sheet iframe. */
    const mediaId = fileInfo.fileUrl.replace('wix:image://v1/', '').split('/')[0];
    const displayUrl = `https://static.wixstatic.com/media/${mediaId}`;

    return { fileUrl: fileInfo.fileUrl, displayUrl };
  }
);
