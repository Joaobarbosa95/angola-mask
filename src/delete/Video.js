import {useRef, useEffect} from 'react'
import { FaceDetection } from '@mediapipe/face_detection';
import {drawingConnectors} from "@mediapipe/drawing_utils"
import { Camera } from '@mediapipe/camera_utils';

const Video = () => {
    const videoRef = useRef(null)
    const canvasElement = useRef(null)
  const canvasCtx = useRef(null)


function onResults(results) {
  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
      results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.detections.length > 0) {
drawingConnectors.drawRectangle(
        canvasCtx, results.detections[0].boundingBox,
        {color: 'blue', lineWidth: 4, fillColor: '#00000000'});
    drawingConnectors.drawLandmarks(canvasCtx, results.detections[0].landmarks, {
      color: 'red',
      radius: 5,
    });
  }
  canvasCtx.restore();
}


  //   useEffect(() => {
  //       if (navigator.mediaDevices.getUserMedia) {
  //     navigator.mediaDevices.getUserMedia({ video: true })
  //       .then(function (stream) {
  //         videoRef.current.srcObject = stream;
  //       })
  //       .catch(function (err0r) {
  //         console.log("Something went wrong!");
  //       });
  //   }

  // })


    useEffect(() => {
     canvasCtx.current = canvasElement.current.getContext("2d")

const faceDetection = new FaceDetection({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.0/${file}`;
}});
faceDetection.setOptions({
  modelSelection: 0,
  minDetectionConfidence: 0.5
});

faceDetection.onResults(onResults);

 if (
      typeof videoRef.current !== "undefined" &&
      videoRef.current !== null
    ) {
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          await faceDetection.send({image: videoRef.current});
        },
        width: 500,
        height: 500
      });
      
      camera.start();
  
    }
})

  return (<div>
    <video autoPlay ref={videoRef} style={{
      width: "100%",
      height: "100%"
    }}></video>
    <canvas style={{
      width: "100%",
      height: "100%"
    }} ref={canvasElement}  ></canvas>
  </div>
  )
}

export default Video