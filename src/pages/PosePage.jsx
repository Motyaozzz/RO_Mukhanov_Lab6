import React, { useRef, useState } from 'react'
import ImageUploader from '../components/ImageUploader'
import { loadPoseDetector } from '../utils/tfloader.js'

function drawKeypoints(ctx, keypoints){
  keypoints.forEach(k => {
    const {x,y,score,name} = k
    if (score > 0.3) {
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2*Math.PI)
      ctx.fillStyle = 'red'
      ctx.fill()
    }
  })
}

const SKELETON = [
  ['left_shoulder','right_shoulder'],
  ['left_shoulder','left_elbow'],
  ['left_elbow','left_wrist'],
  ['right_shoulder','right_elbow'],
  ['right_elbow','right_wrist'],
  ['left_shoulder','left_hip'],
  ['right_shoulder','right_hip'],
  ['left_hip','right_hip'],
  ['left_hip','left_knee'],
  ['left_knee','left_ankle'],
  ['right_hip','right_knee'],
  ['right_knee','right_ankle']
]

function drawSkeleton(ctx, keypoints){
  const map = {}
  keypoints.forEach(k => map[k.name] = k)
  ctx.strokeStyle = 'lime'
  ctx.lineWidth = 2
  SKELETON.forEach(([a,b])=>{
    if(map[a] && map[b] && map[a].score>0.3 && map[b].score>0.3){
      ctx.beginPath()
      ctx.moveTo(map[a].x, map[a].y)
      ctx.lineTo(map[b].x, map[b].y)
      ctx.stroke()
    }
  })
}

export default function PosePage(){
  const [imgUrl, setImgUrl] = useState(null)
  const canvasRef = useRef(null)

  async function onImage(url){
    setImgUrl(url)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    await new Promise(res => img.onload = res)

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = img.width
    canvas.height = img.height
    ctx.clearRect(0,0,canvas.width,canvas.height)
    ctx.drawImage(img,0,0)

    const detector = await loadPoseDetector()
    const poses = await detector.estimatePoses(img)
    if (poses && poses.length>0){
      const pose = poses[0]
      const keypoints = pose.keypoints.map(k => ({x:k.x, y:k.y, score:k.score, name:k.name || k.part}))
      drawKeypoints(ctx, keypoints)
      drawSkeleton(ctx, keypoints)
    }
  }

  return (
    <div>
      <h2>Определение ключевых точек (PoseNet )</h2>
      <p>Загрузите фото — на нём будут отмечены ключевые точки и скелет.</p>
      <ImageUploader onImage={(url)=> onImage(url)} />
      <div style={{marginTop:20}}>
        <canvas ref={canvasRef} style={{maxWidth:'100%'}} />
      </div>
    </div>
  )
}
