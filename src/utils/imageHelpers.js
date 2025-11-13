export function prepareSketchForPix2Pix(canvas, {
  size = 256,
  backgroundColor = '#ffffff',
  strokeColor = '#000000'
} = {}) {
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d');

  tempCanvas.width = size;
  tempCanvas.height = size;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, size, size);

  ctx.drawImage(canvas, 0, 0, size, size);

  return tempCanvas;
}