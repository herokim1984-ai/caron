// ── Image Compression Utility ──
// Compresses images to small base64 strings for Firestore storage
// Target: ~40-50KB per image (max 20 images per car ≈ ~800KB-1MB)

const MAX_WIDTH = 800;
const MAX_HEIGHT = 600;
const QUALITY = 0.6;

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        // Scale down
        if (w > MAX_WIDTH) { h = h * (MAX_WIDTH / w); w = MAX_WIDTH; }
        if (h > MAX_HEIGHT) { w = w * (MAX_HEIGHT / h); h = MAX_HEIGHT; }

        canvas.width = Math.round(w);
        canvas.height = Math.round(h);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const base64 = canvas.toDataURL('image/jpeg', QUALITY);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressMultipleImages(files) {
  const results = [];
  for (const file of files) {
    try {
      const base64 = await compressImage(file);
      results.push(base64);
    } catch (err) {
      console.error('Image compression failed:', err);
    }
  }
  return results;
}
