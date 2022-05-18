import { FaceMesh } from "@mediapipe/face_mesh";
import React, { useState, useRef, useEffect } from "react";
import * as Facemesh from "@mediapipe/face_mesh";
import * as cam from "@mediapipe/camera_utils";
import Webcam from "react-webcam";
import { drawConnectors } from "@mediapipe/drawing_utils";

import VideoScreen from "../VideoScreen"

// Utils
import {normalizedToPixelCoordinates} from "../utils/normalized_to_pixel_coordinates"
import {wearMask, mask, draw} from "../utils/wearMask"

// Constant
// const DISPLAY_WIDTH = 1920
// const DISPLAY_HEIGHT = 1080
const DISPLAY_WIDTH = 1080
const DISPLAY_HEIGHT =  1920

const FaceMask = () => {
const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  var camera = null;

  const [screenSaver, setScreenSaver] = useState(true)
  const [timeoutTimer, setTimeoutTimer] = useState(true)
 
  let timeout 

  useEffect(() => {
    if(timeoutTimer)  
    timeout = setTimeout(() => {
      setScreenSaver(true)  
    }, 5000)
    
    
    return () => { 
      clearTimeout(timeout)
    }
  }, [timeoutTimer]) 

  function onResults(results) { 
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    
    // Set canvas width
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);   
    
    
    // if no face landmarks detected 
    if(!screenSaver && !results.multiFaceLandmarks[0]?.length) { 
      return
    } 
    else if (!results.multiFaceLandmarks[0]?.length) {
      setTimeoutTimer(true)
      return
    } else {
      setTimeoutTimer(false)
      setScreenSaver(false)
    }     

    
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    ); 
 
    if (results.multiFaceLandmarks) {   
        // face points coordinates/landmarks
        // Forehead: 10
        // Left Cheek: 234
        // Chin: 152
        // Right Cheek: 454
        const forehead = results.multiFaceLandmarks[0]?.[10]
        const leftCheek = results.multiFaceLandmarks[0]?.[234]
        const chin = results.multiFaceLandmarks[0]?.[152]
        const rightCheek = results.multiFaceLandmarks[0]?.[454]
        const leftEyeCorner = results.multiFaceLandmarks[0]?.[130];
        const rightEyeCorner = results.multiFaceLandmarks[0]?.[359];
    

        if(!forehead || !leftCheek || !chin || !rightCheek || !leftEyeCorner || !rightEyeCorner) return
        
        // Values in pixels = {x, y}
        const foreheadPx = normalizedToPixelCoordinates(forehead.x, forehead.y, videoWidth, videoHeight) 
        const leftCheekPx = normalizedToPixelCoordinates(leftCheek.x, leftCheek.y, videoWidth, videoHeight)
        const chinPx = normalizedToPixelCoordinates(chin.x, chin.y, videoWidth, videoHeight)
        const rightCheekPx = normalizedToPixelCoordinates(rightCheek.x, rightCheek.y, videoWidth, videoHeight) 
        const rightEyeCornerPx = normalizedToPixelCoordinates(rightEyeCorner.x, rightEyeCorner.y, videoWidth, videoHeight )
        const leftEyeCornerPx = normalizedToPixelCoordinates(leftEyeCorner.x, leftEyeCorner.y, videoWidth, videoHeight)
        
        if(!foreheadPx || !leftCheekPx || !chinPx || !rightCheekPx || !rightEyeCornerPx || !leftEyeCornerPx) return
        
        // if side face return
        if(foreheadPx.x_px > rightCheekPx.x_px || foreheadPx.x_px < leftCheekPx.x_px ) return

       // Formula to calculate distance between to points in 2D space (Euclidian distance)
       // d = √((x2-x1)2 + (y2-y1)2)

        const height = Math.sqrt(Math.pow( (chinPx.x_px - foreheadPx.x_px), 2) + Math.pow((chinPx.y_px - foreheadPx.y_px), 2))
        const width = Math.sqrt(Math.pow((leftCheekPx.x_px - rightCheekPx.x_px), 2) +  Math.pow((leftCheekPx.y_px - rightCheekPx.y_px), 2))

        // rotation 
        const rotationAngle = rightCheekPx.y_px - leftCheekPx.y_px
      
        wearMask("mask.jpg", leftCheekPx.x_px, foreheadPx.y_px, width , height, canvasCtx, rightEyeCornerPx, leftEyeCornerPx)
        
        for (const landmarks of results.multiFaceLandmarks) { 
        drawConnectors(canvasCtx, landmarks, Facemesh.FACEMESH_FACE_OVAL, {
          color: "red"
        });
      
      }
    }
    canvasCtx.restore();
  }


  useEffect(() => {
    const faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    faceMesh.setOptions({
      selfieMode: true,
      maxNumFaces: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(onResults);
    
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      camera = new cam.Camera(webcamRef.current.video, {
        onFrame: async () => {
          await faceMesh.send({ image: webcamRef.current.video });
        },
        // width: DISPLAY_WIDTH,
        // height: DISPLAY_HEIGHT,
      });
      camera.start();
    }
  }, []);

  const videoConstraints = {
    video: {
    width: 1920,
    height: 1080
  }
  }

  // Return
  return ( 
    <>
        {/* <video style={{zIndex: 99}} autoPlay muted loop playsInline src="screenSaver.webm" crossOrigin='anonymous' ></video>    */}

        <Webcam
          ref={webcamRef}
          style={{
            zindex: 9,
            // width: DISPLAY_WIDTH,
            // height: DISPLAY_HEIGHT,
                     
          }}
          mirrored={true}
          videoConstraints={videoConstraints}
          />
          
          {/* {screenSaver && <VideoScreen /> } */}
        <canvas
          ref={canvasRef}
          className="output_canvas"
          style={{
            position: "absolute",
            zindex: 9,
          }}
          >

          </canvas>
          
    </>
  );

}

export default FaceMask