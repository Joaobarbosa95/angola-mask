import {useRef, useEffect} from 'react'

import {Camera} from "@mediapipe/camera_utils"
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import {Hands} from "@mediapipe/hands"
import Webcam from "react-webcam";
import { HAND_CONNECTIONS  } from '@mediapipe/hands';

const Swipe = () => {
    const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  var camera = null;

    const enterArea = useRef(null)

    const mockRecColor = ["red", "blue", "green"]
    const activeMask = useRef(0)
    
    function swipe(swipeType) {    
            if(activeMask.current === 2 && swipeType === "right") {
                enterArea.current = null
                return activeMask.current = 0
            }
            if(activeMask.current === 0 && swipeType === "left") {
                 enterArea.current = null
                return  activeMask.current = 2
            } 
            
            if(swipeType === "right") {
                 enterArea.current = null
                return  activeMask.current++
            } 
            if(swipeType === "left") {
                enterArea.current = null
                return  activeMask.current--
            } 
    }



function onResults(results) {
   const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    
    // Set canvas widt:14
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);   
  

    
    // console.log(results) 
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
        
        if (results.multiHandLandmarks) { 
            // Swipe
            let swipeTime = new Date().getTime() - enterArea.current?.timestamp
            
            if(enterArea.current && results.multiHandLandmarks[0]?.[12].x > 0.85 && swipeTime < 1000) swipe("right")
            if(enterArea.current && results.multiHandLandmarks[0]?.[12].x < 0.15 && swipeTime < 1000) swipe("left")

            if(results.multiHandLandmarks[0]?.[12].x > 0.75 && results.multiHandLandmarks[0]?.[12].x < 0.8) {
                console.log("rigth")
                enterArea.current = {enteredZone: "right", timestamp: new Date().getTime()} 
            } else if(results.multiHandLandmarks[0]?.[12].x < 0.25 && results.multiHandLandmarks[0]?.[12].x > 0.2) {
                console.log("right")
                enterArea.current = {enteredZone: "left", timestamp: new Date().getTime()}
            } else if ((results.multiHandLandmarks[0]?.[12].x > 0.25) && (results.multiHandLandmarks[0]?.[12].x < 0.75)) {
                enterArea.current = null
            }


            canvasCtx.fillStyle = mockRecColor[activeMask.current]
            canvasCtx.fillRect(150, 50, 100, 100)

            
            canvasCtx.beginPath()
            canvasCtx.moveTo(100, 0)
            canvasCtx.lineTo(100, 500)
            canvasCtx.moveTo(400, 0)
            canvasCtx.lineTo(400, 500)
            canvasCtx.closePath()
            canvasCtx.stroke()
            for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
        {color: '#00FF00', lineWidth: 5});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
    }
  }
  canvasCtx.restore();
}  

  useEffect(() => {
  const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  selfieMode: true,
  maxNumHands: 2,
  modelComplexity: 1,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

 if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          await hands.send({ image: webcamRef.current.video });
        },
        width: 1080,
        height: 1920,
      });
    }

camera.start();
  }, [])


  return (
      <div>

<Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            // width: 1080,
            // height: 1920,
          }}
          />

<canvas
          ref={canvasRef}
          className="output_canvas"
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 11,
            width: 1080,
            height: 1920,
          }}
          >

          </canvas>
 
      </div>
  )
}

export default Swipe
//---------------------------- 
//|   |                   |  |
//|   |                   |  |
//----------------------------
// create a zone (left or right) enter event  
// fire the event while hand inside
// add "initial" x to an array 
// if initial x - final x, if hand never leaves zone
// equal to middle space a swipe was made

