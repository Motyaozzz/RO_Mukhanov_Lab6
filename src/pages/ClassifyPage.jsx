import React, { useState } from 'react'
import ImageUploader from '../components/ImageUploader'
import { loadMobileNet } from '../utils/tfloader.js'

export default function ClassifyPage(){
  const [imgUrl, setImgUrl] = useState(null)
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(false)

  async function onImage(url){
    setImgUrl(url)
    setPredictions(null)
    setLoading(true)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    await new Promise((res)=> img.onload = res)

    const model = await loadMobileNet()
    const preds = await model.classify(img)
    setPredictions(preds)
    setLoading(false)
  }

  return (
    <div>
      <h2>Классификация изображений (MobileNet)</h2>
      <p>Загрузите фото — ниже будут представлены 3 наиболее вероятные классификации нейросетью</p>
      <ImageUploader onImage={(url)=> onImage(url)} />
      {imgUrl && <img src={imgUrl} alt="upload" style={{maxWidth:400, marginTop:20}} />}
      {loading && <p>Predicting...</p>}
      {predictions && (
        <div>
          <h3>Top predictions</h3>
          <ul>
            {predictions.map((p, i)=> <li key={i}>{p.className} — {(p.probability*100).toFixed(2)}%</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}
