from flask import Flask, request, send_file
from flask_cors import CORS
import torch
import torch.nn as nn
from PIL import Image
import io
import numpy as np
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000'])

device = "cuda" if torch.cuda.is_available() else "cpu"
model = None

class UNetGenerator(nn.Module):
    """U-Net генератор для pix2pix"""
    def __init__(self):
        super().__init__()
        # Encoder - downsampling path
        self.e1 = nn.Sequential(nn.Conv2d(3, 64, 4, 2, 1), nn.LeakyReLU(0.2))
        self.e2 = nn.Sequential(nn.Conv2d(64, 128, 4, 2, 1), nn.BatchNorm2d(128), nn.LeakyReLU(0.2))
        self.e3 = nn.Sequential(nn.Conv2d(128, 256, 4, 2, 1), nn.BatchNorm2d(256), nn.LeakyReLU(0.2))
        self.e4 = nn.Sequential(nn.Conv2d(256, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.LeakyReLU(0.2))
        self.e5 = nn.Sequential(nn.Conv2d(512, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.LeakyReLU(0.2))
        self.e6 = nn.Sequential(nn.Conv2d(512, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.LeakyReLU(0.2))
        self.e7 = nn.Sequential(nn.Conv2d(512, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.LeakyReLU(0.2))
        self.e8 = nn.Sequential(nn.Conv2d(512, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.ReLU())
        
        # Decoder - upsampling path with skip connections
        self.d1 = nn.Sequential(nn.ConvTranspose2d(512, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.Dropout(0.5), nn.ReLU())
        self.d2 = nn.Sequential(nn.ConvTranspose2d(1024, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.Dropout(0.5), nn.ReLU())
        self.d3 = nn.Sequential(nn.ConvTranspose2d(1024, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.Dropout(0.5), nn.ReLU())
        self.d4 = nn.Sequential(nn.ConvTranspose2d(1024, 512, 4, 2, 1), nn.BatchNorm2d(512), nn.ReLU())
        self.d5 = nn.Sequential(nn.ConvTranspose2d(1024, 256, 4, 2, 1), nn.BatchNorm2d(256), nn.ReLU())
        self.d6 = nn.Sequential(nn.ConvTranspose2d(512, 128, 4, 2, 1), nn.BatchNorm2d(128), nn.ReLU())
        self.d7 = nn.Sequential(nn.ConvTranspose2d(256, 64, 4, 2, 1), nn.BatchNorm2d(64), nn.ReLU())
        self.d8 = nn.Sequential(nn.ConvTranspose2d(128, 3, 4, 2, 1), nn.Tanh())
    
    def forward(self, x):
        # Encoder
        e1 = self.e1(x)
        e2 = self.e2(e1)
        e3 = self.e3(e2)
        e4 = self.e4(e3)
        e5 = self.e5(e4)
        e6 = self.e6(e5)
        e7 = self.e7(e6)
        e8 = self.e8(e7)
        
        # Decoder with skip connections
        d1 = self.d1(e8)
        d1 = torch.cat([d1, e7], 1)
        d2 = self.d2(d1)
        d2 = torch.cat([d2, e6], 1)
        d3 = self.d3(d2)
        d3 = torch.cat([d3, e5], 1)
        d4 = self.d4(d3)
        d4 = torch.cat([d4, e4], 1)
        d5 = self.d5(d4)
        d5 = torch.cat([d5, e3], 1)
        d6 = self.d6(d5)
        d6 = torch.cat([d6, e2], 1)
        d7 = self.d7(d6)
        d7 = torch.cat([d7, e1], 1)
        d8 = self.d8(d7)
        
        return d8

def initialize_model():
    """Инициализирует модель один раз при запуске"""
    global model
    if model is None:
        logger.info(f"🔄 Инициализация U-Net на {device}...")
        model = UNetGenerator().to(device).eval()
        
        # Xavier инициализация для весов
        for m in model.modules():
            if isinstance(m, nn.Conv2d) or isinstance(m, nn.ConvTranspose2d):
                nn.init.xavier_uniform_(m.weight)
                if m.bias is not None:
                    nn.init.zeros_(m.bias)
            elif isinstance(m, nn.BatchNorm2d):
                nn.init.ones_(m.weight)
                nn.init.zeros_(m.bias)
        
        logger.info("✅ Модель готова к работе\n")

@app.route('/api/pix2pix', methods=['POST', 'OPTIONS'])
def pix2pix():
    """Генерирует изображение из входного эскиза"""
    if request.method == 'OPTIONS':
        return '', 200
    
    try:
        initialize_model()
        
        # Читаем входное изображение
        image = Image.open(io.BytesIO(request.data)).convert('RGB')
        
        # Изменяем размер если нужно
        if image.size != (256, 256):
            image = image.resize((256, 256), Image.LANCZOS)
        
        # Нормализуем в диапазон [-1, 1]
        img_np = np.array(image, dtype=np.float32) / 127.5 - 1.0
        img_tensor = torch.from_numpy(img_np).permute(2, 0, 1).unsqueeze(0).to(device)
        
        # Генерируем выходное изображение
        with torch.no_grad():
            output = model(img_tensor)
        
        # Конвертируем обратно в изображение ([-1, 1] -> [0, 255])
        output_np = (output[0].permute(1, 2, 0).cpu().numpy() + 1) / 2 * 255
        output_np = np.clip(output_np, 0, 255).astype(np.uint8)
        output_img = Image.fromarray(output_np)
        
        # Возвращаем PNG
        img_io = io.BytesIO()
        output_img.save(img_io, 'PNG')
        img_io.seek(0)
        
        return send_file(img_io, mimetype='image/png')
        
    except Exception as e:
        logger.error(f"❌ Ошибка: {e}")
        return {'error': str(e)}, 500

@app.route('/health')
def health():
    """Проверка статуса сервера"""
    return {'status': 'ok', 'device': device}

if __name__ == '__main__':
    logger.info("🚀 Flask сервер pix2pix")
    logger.info("   Слушаю на http://localhost:3001\n")
    app.run(host='0.0.0.0', port=3001, debug=False)
