import {useRef, useEffect} from "react"
import {FaceDetection} from "@mediapipe/face_detection"
// import * as Facedetection from "@mediapipecanvasCtx.current = canvasElement.getContext("2d")/face_detection"
import {drawingConnectors} from "@mediapipe/drawing_utils"
import {Camera} from "@mediapipe/camera_utils"

const FaceDetection2 = function() {
    const canvasElement = useRef(null)
    const videoElement = useRef(null)
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

useEffect(() => {
  canvasCtx.current = canvasElement.current.getContext("2d")
  if (navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(function (stream) {
          videoElement.current.srcObject = stream;
        })
        .catch(function (err0r) {
          console.log("Something went wrong!");
        });
    }

    const faceDetection = new FaceDetection({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.0/${file}`;
}});
faceDetection.setOptions({
  modelSelection: 0,
  minDetectionConfidence: 0.5
});
faceDetection.onResults(onResults);

const camera = new Camera(videoElement.current, {
  onFrame: async () => {
    await faceDetection.send({image: videoElement.current});
  },
  width: 500,
  height: 500
});
camera.start();

})


  return <>
  <div className="container">
    <video ref={videoElement} autoPlay className="input_video"></video>
    <canvas ref={canvasElement} className="output_canvas" width="500" height="500"></canvas>
  </div>
  
  </> 
}

export default FaceDetection2