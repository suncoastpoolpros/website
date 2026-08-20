/**
 * Image/blob helpers shared by the admin document builders (proposal + first
 * service report). Photos are baked straight into the generated PDF, so they
 * have to be small enough to survive an email attachment limit.
 */

/** Read a Blob as a base64 string with the `data:...;base64,` prefix stripped. */
export const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * Shrink a phone photo before it goes into the PDF — full-res images would
 * blow past the email attachment limit.
 *
 * 900px ON THE LONG EDGE IS DERIVED, not guessed. Both documents render photos
 * in a 248 x 156pt box (ProposalDocument and InspectionDocument), which is
 * 3.4 x 2.2 inches. 900px across that box is about 260 DPI — sharp even
 * printed, and comfortably past the ~700px a retina screen needs to show it at
 * 100% without softness.
 *
 * It was 1400px, which is roughly 400 DPI: more resolution than the box can
 * ever display, at more than double the bytes. Each photo now costs ~120 KB
 * instead of ~215 KB, and these travel THREE times — up to the send endpoint,
 * out as part of the emailed PDF, and back down when a customer re-downloads.
 *
 * Going further hurts. At 450px the same box is ~130 DPI, which is visibly soft
 * on any retina display and worse on paper — and this is a photograph of the
 * customer's own property inside a document they may keep or print.
 */
export const downscaleImage = (file: File, maxDim = 900, quality = 0.7): Promise<string> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width >= height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > width && height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('no_canvas'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image_load_failed'));
    };
    img.src = url;
  });
