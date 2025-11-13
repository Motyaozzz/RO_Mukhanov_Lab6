import React, { useRef, useState, useEffect, useCallback } from 'react';
import { queryPix2Pix, canvasToBlob, revokeObjectUrl } from '../utils/pix2pix';
import { prepareSketchForPix2Pix } from '../utils/imageHelpers';

export default function Pix2Pix() {
  const canvasRef = useRef(null);
  const [outputUrl, setOutputUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const brushSettings = {
    color: '#000000',
    size: 6
  };

  const initializeCanvas = useCallback((canvas) => {
    if (!canvas) return;
    const width = 256;
    const height = 256;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSettings.size;
    ctx.strokeStyle = brushSettings.color;
  }, [brushSettings.color, brushSettings.size]);

  useEffect(() => {
    initializeCanvas(canvasRef.current);

    return () => {
      if (outputUrl) revokeObjectUrl(outputUrl);
    };
  }, []);

  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = brushSettings.size;
    ctx.strokeStyle = brushSettings.color;
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (!canvasRef.current) {
      setIsDrawing(false);
      return;
    }
    const canvas = canvasRef.current;
    try { canvas.releasePointerCapture?.(e?.pointerId); } catch (err) { /* ignore */ }
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSettings.size;
    ctx.strokeStyle = brushSettings.color;
    setError(null);
    if (outputUrl) {
      revokeObjectUrl(outputUrl);
      setOutputUrl(null);
    }
  };

  const generateImage = async () => {
    setLoading(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error('Canvas не инициализирован');

      const preparedCanvas = prepareSketchForPix2Pix(canvas);
      const imageBlob = await canvasToBlob(preparedCanvas);
      const resultBlob = await queryPix2Pix(imageBlob);
      const resultUrl = URL.createObjectURL(resultBlob);

      if (outputUrl) revokeObjectUrl(outputUrl);
      setOutputUrl(resultUrl);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.message || 'Ошибка при генерации изображения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h2>Скетч → Обои (Pix2Pix) </h2>
      <p>Нарисуйте контур обоев — затем нажмите «Сгенерировать».</p>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        <div>
          <h4>Нарисуйте контур:</h4>
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            onPointerLeave={stopDrawing}
            style={{
              width: 256,
              height: 256,
              border: '2px solid #333',
              borderRadius: '8px',
              cursor: 'crosshair',
            }}
          />
          <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
            <button onClick={clearCanvas} style={buttonStyleDanger}>Очистить</button>
            <button onClick={generateImage} disabled={loading} style={loading ? buttonStyleDisabled : buttonStylePrimary}>
              {loading ? 'Генерация...' : 'Сгенерировать'}
            </button>
          </div>
          {error && <div style={{ marginTop: 10, color: 'red' }}>{error}</div>}
        </div>

        <div>
          <h4>Результат:</h4>
          {outputUrl ? (
            <img src={outputUrl} alt="Generated result" style={{ width: 256, height: 256, border: '2px solid #333', borderRadius: 8 }} />
          ) : (
            <div style={{ width: 256, height: 256, border: '2px dashed #ccc', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
              {loading ? 'Генерация...' : 'Здесь появится результат'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const buttonStylePrimary = {
  padding: '10px 16px',
  backgroundColor: '#007bff',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
};
const buttonStyleDanger = {
  padding: '10px 16px',
  backgroundColor: '#ff4444',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
};
const buttonStyleDisabled = {
  padding: '10px 16px',
  backgroundColor: '#ccc',
  color: '#666',
  border: 'none',
  borderRadius: 6,
  cursor: 'not-allowed'
};
