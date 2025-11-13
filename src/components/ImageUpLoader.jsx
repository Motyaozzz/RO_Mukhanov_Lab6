import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

export default function ImageUploader({ onImage }) {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onImage(url, file)
  }, [onImage])

  const {getRootProps, getInputProps, isDragActive} = useDropzone({onDrop, accept: { 'image/*': [] }})

  return (
    <div {...getRootProps()} style={{border:'2px dashed #aaa', padding:20, textAlign:'center', borderRadius:8, cursor:'pointer'}}>
      <input {...getInputProps()} />
      {isDragActive ? <p>Drop the image here ...</p> : <p>Drag & drop an image here, or click to select</p>}
    </div>
  )
}
