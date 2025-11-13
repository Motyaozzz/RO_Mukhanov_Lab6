const PIX2PIX_API_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}`
  : 'http://localhost:3001') + '/api/pix2pix';

export async function queryPix2Pix(imageFile) {
  try {
    const resp = await fetch(PIX2PIX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: imageFile
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Pix2Pix server error: ${text}`);
    }

    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) {
      throw new Error(`Expected image, got: ${contentType}`);
    }

    const blob = await resp.blob();
    return blob;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => {
        if (!b) return reject(new Error('Не удалось конвертировать canvas в Blob'));
        resolve(b);
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

export function revokeObjectUrl(url) {
  try {
    if (url) URL.revokeObjectURL(url);
  } catch (err) {
    // ignore
  }
}
