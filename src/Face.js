import {useRef, useEffect, useState} from 'react'

import Webcam from "react-webcam";

import { FACEMESH_CONTOURS, FACEMESH_FACE_OVAL, Holistic } from '@mediapipe/holistic'
import { drawConnectors, POSE_CONNECTIONS, drawLandmarks, FACEMESH_TESSELATION, HAND_CONNECTIONS } from '@mediapipe/drawing_utils'
import { Camera } from '@mediapipe/camera_utils'

import VideoScreen from "./VideoScreen"

// Utils
import {normalizedToPixelCoordinates} from "./utils/normalized_to_pixel_coordinates"
import {wearMask} from "./utils/wearMask"



// Constants
const DISPLAY_WIDTH = 1080
const DISPLAY_HEIGHT = 1920
const SCREEN_SAVER_TIMEOUT_TIME = 5000 // 5s
const SWIPE_TIMER = 1000



const Face = function () {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  let camera = null;

 const enterArea = useRef(null)

  const masksArray = ["mask.jpg", "mask2.png", "mask3.png"]
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



  // const [screenSaver, setScreenSaver] = useState(true)
  // const [timeoutTimer, setTimeoutTimer] = useState(true)

  // useEffect(() => {
  //   if(!timeoutTimer) return 

  //   const timeout = setTimeout(() => {
  //     setScreenSaver(true)  
  //   }, SCREEN_SAVER_TIMEOUT_TIME)
    
    
  //   return () => { 
  //     clearTimeout(timeout)
  //   }
  // }, [timeoutTimer]) 


// Results
  function onResults(results) {  
    // Set canvas width
    canvasRef.current.width = DISPLAY_WIDTH;
    canvasRef.current.height = DISPLAY_HEIGHT;

    const canvasCtx = canvasRef.current.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);   
  
    // console.log(results.faceLandmarks)
    // if no face landmarks detected
    // and screen saver is not set 
    // console.log(results.faceLandmarks?.length)
    // if(screenSaver && !results.faceLandmarks?.length) { 
    //   return
    // } 
    // else if (!results.faceLandmarks?.length) {
    //   setTimeoutTimer(true)
    //   return
    // } else {
    //   setTimeoutTimer(false)
    //   setScreenSaver(false)
    // }     
 
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      DISPLAY_WIDTH,
      DISPLAY_HEIGHT
    ); 

    /**
     * HANDS 
     */
           if (results.leftHandLandmarks || results.rightHandLandmarks) { 
            // Swipe
            let swipeTime = new Date().getTime() - enterArea.current?.timestamp
            
            if(enterArea.current && results.leftHandLandmarks?.[0].x > 0.85 && swipeTime < 1000) swipe("right")
            if(enterArea.current && results.rightHandLandmarks?.[0].x < 0.15 && swipeTime < 1000) swipe("left")

            if(results.leftHandLandmarks?.[0].x > 0.75 && results.leftHandLandmarks?.[0].x < 0.8) {
                enterArea.current = {enteredZone: "right", timestamp: new Date().getTime()} 
            } else if(results.rightHandLandmarks?.[0].x < 0.25 && results.rightHandLandmarks?.[0].x > 0.2) {
                enterArea.current = {enteredZone: "left", timestamp: new Date().getTime()}
            } else if ((results.rightHandLandmarks?.[0].x > 0.25) && (results.leftHandLandmarks?.[0].x < 0.75)) {
                enterArea.current = null
            }
          }

 
    /**
     * FACE
     */
    if (results.faceLandmarks) {   
      // face points coordinates/landmarks
        // Forehead: 10
        // Left Cheek: 234
        // Chin: 152
        // Right Cheek: 454
        const forehead = results.faceLandmarks?.[10]
        const leftCheek = results.faceLandmarks?.[234]
        const chin = results.faceLandmarks?.[152]
        const rightCheek = results.faceLandmarks?.[454]
        const leftEyeCorner = results.faceLandmarks?.[130];
        const rightEyeCorner = results.faceLandmarks?.[359];

        if(!forehead || !leftCheek || !chin || !rightCheek || !leftEyeCorner || !rightEyeCorner) return

        // Values in pixels
        const foreheadPx = normalizedToPixelCoordinates(forehead.x, forehead.y, DISPLAY_WIDTH, DISPLAY_HEIGHT) 
        const leftCheekPx = normalizedToPixelCoordinates(leftCheek.x, leftCheek.y, DISPLAY_WIDTH, DISPLAY_HEIGHT)
        const chinPx = normalizedToPixelCoordinates(chin.x, chin.y, DISPLAY_WIDTH, DISPLAY_HEIGHT)
        const rightCheekPx = normalizedToPixelCoordinates(rightCheek.x, rightCheek.y, DISPLAY_WIDTH, DISPLAY_HEIGHT) 
        const rightEyeCornerPx = normalizedToPixelCoordinates(rightEyeCorner.x, rightEyeCorner.y, DISPLAY_WIDTH, DISPLAY_HEIGHT )
        const leftEyeCornerPx = normalizedToPixelCoordinates(leftEyeCorner.x, leftEyeCorner.y, DISPLAY_WIDTH, DISPLAY_HEIGHT)

        if(!foreheadPx || !leftCheekPx || !chinPx || !rightCheekPx || !rightEyeCornerPx || !leftEyeCornerPx) return

        // if side face return
        if(foreheadPx.x_px > rightCheekPx.x_px || foreheadPx.x_px < leftCheekPx.x_px ) return

        // face width, height
       // d = √((x2-x1)2 + (y2-y1)2)
        const faceHeight = Math.sqrt(Math.pow( (chinPx.x_px - foreheadPx.x_px), 2) + Math.pow((chinPx.y_px - foreheadPx.y_px), 2))
        const faceWidth = Math.sqrt(Math.pow((leftCheekPx.x_px - rightCheekPx.x_px), 2) +  Math.pow((leftCheekPx.y_px - rightCheekPx.y_px), 2))

        // Render face mask
        wearMask(masksArray[activeMask.current], leftCheekPx.x_px, foreheadPx.y_px, faceWidth , faceHeight, canvasCtx, rightEyeCornerPx, leftEyeCornerPx)

         drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_CONTOURS,
                 {color: 'red', lineWidth: 3});
      }
      canvasCtx.restore();
    }


    // Init
  useEffect(() => {
const holistic = new Holistic({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
}});

holistic.setOptions({
  selfieMode: true,
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: true,
  smoothSegmentation: true,
  refineFaceLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

holistic.onResults(onResults);

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          
          await holistic.send({ image: webcamRef.current.video });
        },
        width: DISPLAY_WIDTH,
        height: DISPLAY_HEIGHT,
      });
      camera.start();
    }

  }, [])



return ( 
    <>
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
            width: DISPLAY_WIDTH,
            height: DISPLAY_HEIGHT,
          }}
          />
          
          {/* {screenSaver && <VideoScreen width={DISPLAY_WIDTH} displayHeight={DISPLAY_HEIGHT}/> } */}
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
            zindex: 10,
            width: DISPLAY_WIDTH,
            height: DISPLAY_HEIGHT,
          }}
          >

          </canvas>
 
    </>)
}

export default Face