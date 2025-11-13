import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as poseDetection from '@tensorflow-models/pose-detection';

let mobilenetModel = null;
let poseDetector = null;

async function ensureBackend(preferred = 'webgl') {
  try {
    const current = tf.getBackend();
    console.log('[tfLoaders] current tf backend:', current);

    if (current !== preferred) {
      const setOk = await tf.setBackend(preferred);
      console.log(`[tfLoaders] setBackend(${preferred}) ->`, setOk);
    }

    await tf.ready();
    console.log('[tfLoaders] tf is ready. Backend =', tf.getBackend());
  } catch (err) {
    console.warn('[tfLoaders] ensureBackend failed for', preferred, err);
    try {
      if (tf.getBackend() !== 'wasm') {
        const setWasm = await tf.setBackend('wasm');
        console.log('[tfLoaders] fallback setBackend(wasm) ->', setWasm);
        await tf.ready();
      }
    } catch (e2) {
      console.warn('[tfLoaders] wasm fallback failed', e2);
      try {
        if (tf.getBackend() !== 'cpu') {
          const setCpu = await tf.setBackend('cpu');
          console.log('[tfLoaders] fallback setBackend(cpu) ->', setCpu);
          await tf.ready();
        }
      } catch (e3) {
        console.error('[tfLoaders] cpu fallback failed', e3);
        throw e3;
      }
    }
  }
}

export async function loadMobileNet() {
  if (mobilenetModel) return mobilenetModel;
  await ensureBackend('webgl'); // гарантируем рабочий бекенд перед загрузкой
  try {
    console.log('[tfLoaders] loading MobileNet...');
    mobilenetModel = await mobilenet.load({ version: 2, alpha: 1.0 });
    console.log('[tfLoaders] MobileNet loaded');
    return mobilenetModel;
  } catch (e) {
    console.error('[tfLoaders] MobileNet load error', e);
    throw e;
  }
}

export async function loadPoseDetector() {
  if (poseDetector) return poseDetector;
  await ensureBackend('webgl');
  try {
    console.log('[tfLoaders] creating MoveNet detector...');
    const detectorConfig = { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING };
    poseDetector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    console.log('[tfLoaders] MoveNet loaded');
    return poseDetector;
  } catch (e) {
    console.error('[tfLoaders] Pose detector error', e);
    throw e;
  }
}