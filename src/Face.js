import { useRef, useEffect, useState } from "react";

import {
  FACEMESH_CONTOURS,
  Holistic,
} from "@mediapipe/holistic";
import {
  drawConnectors,
} from "@mediapipe/drawing_utils";
import { Camera } from "@mediapipe/camera_utils";

import VideoScreen from "./VideoScreen";
import ResultDisplay from "./ResultDisplay"

// Utils
import { normalizedToPixelCoordinates } from "./utils/normalized_to_pixel_coordinates";
import { wearMask } from "./utils/wearMask";

// Constants
const DISPLAY_WIDTH = 1920;
const DISPLAY_HEIGHT = 1080;

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

const SCREEN_SAVER_TIMEOUT_TIME = 5000; // 5s
const SWIPE_TIME = 1000;
const COUNTDOWN_TIME = 10

const URL = ""

const Face = function () {
  const canvasRef = useRef(null);
  const helperCanvasRef = useRef(null);

  const enterArea = useRef(null);

  const masksArray = ["mask.jpg", "mask2.png", "mask3.png"];
  const activeMask = useRef(0);

  const [recording, setRecording] = useState(false)
  const [photoURL, setPhotoURL] = useState(null)
  const [countdown, setCountdown] = useState(5)
  const photoRef = useRef(null)

  function submitPhoto(e) {
    e.preventDefault()
  
    const base64 = photoURL.split(',')[1];

    // fetch(URL, {
    //   method: "POST",
    //   body: {
    //     email: e.target.email.value,
    //     image: base64
      // }
    // })

    setPhotoURL(null)
    setCountdown(COUNTDOWN_TIME)
    setRecording(false)
    photoRef.current = null
  }  


  function swipe(swipeType) {
    if (activeMask.current === 2 && swipeType === "right") {
      setCountdown(COUNTDOWN_TIME)
      enterArea.current = null;
      return (activeMask.current = 0);
    }
    if (activeMask.current === 0 && swipeType === "left") {
      setCountdown(COUNTDOWN_TIME)
      enterArea.current = null;
      return (activeMask.current = 2);
    }

    if (swipeType === "right") {
      setCountdown(COUNTDOWN_TIME)
      enterArea.current = null;
      return activeMask.current++;
    }
    if (swipeType === "left") {
      setCountdown(COUNTDOWN_TIME)
      enterArea.current = null;
      return activeMask.current--;
    }
  }

  const [screenSaver, setScreenSaver] = useState(false)
  const timeoutTimer = useRef(false)

  // Countdown logic
  useEffect(() => {
    if(!recording) return
  
    const timer = setInterval(() => {
      setCountdown(countdown => {
        if(countdown === 1) {
          takePhoto(canvasRef, setPhotoURL, photoRef)
          clearInterval(timer)      
          return
        }
        return countdown - 1
      })
    }, 1000)  

    return () => {
      clearInterval(timer)
      setCountdown(5)
    }
  }, [recording])

 
  // Results
  function onResults(results) {
    const canvasCtx = canvasRef.current.getContext("2d");

    // if no face landmarks detected
    // and screen saver is not set 
   if(results.faceLandmarks?.length) {
     clearTimeout(timeoutTimer.current)
     timeoutTimer.current  = false 
     setScreenSaver(false)
    } else if (!timeoutTimer.current) {
      timeoutTimer.current = setTimeout(() => {
        setScreenSaver(true)
      }, SCREEN_SAVER_TIMEOUT_TIME)
    } 
    
    canvasCtx.drawImage(results.image, 0, 0, DISPLAY_HEIGHT, DISPLAY_WIDTH);

    /**
     * HAND SWIPE
     */
    if (results.leftHandLandmarks || results.rightHandLandmarks) {
      let swipeTime = new Date().getTime() - enterArea.current?.timestamp;
      if (
        enterArea.current &&
        results.leftHandLandmarks?.[0].x > 0.85 &&
        swipeTime < SWIPE_TIME
      )
        swipe("right");
      
      if (
        enterArea.current &&
        results.rightHandLandmarks?.[0].x < 0.15 &&
        swipeTime < SWIPE_TIME
      )
        swipe("left");

      if (
        results.leftHandLandmarks?.[0].x > 0.75 &&
        results.leftHandLandmarks?.[0].x < 0.8
      ) {
        enterArea.current = {
          enteredZone: "right",
          timestamp: new Date().getTime(),
        };
      } else if (
        results.rightHandLandmarks?.[0].x < 0.25 &&
        results.rightHandLandmarks?.[0].x > 0.2
      ) {
        enterArea.current = {
          enteredZone: "left",
          timestamp: new Date().getTime(),
        };
      } else if (
        results.rightHandLandmarks?.[0].x > 0.25 &&
        results.leftHandLandmarks?.[0].x < 0.75
      ) {
        enterArea.current = null;
      }
    }

    /**
     * FACE MASK
     */
    if (results.faceLandmarks) {
      // face points coordinates/landmarks
      // Forehead: 10
      // Left Cheek: 234
      // Chin: 152
      // Right Cheek: 454
      // Left Eye: 130
      // Right Eye: 359
      const forehead = results.faceLandmarks?.[10];
      const leftCheek = results.faceLandmarks?.[234];
      const chin = results.faceLandmarks?.[152];
      const rightCheek = results.faceLandmarks?.[454];
      const leftEyeCorner = results.faceLandmarks?.[130];
      const rightEyeCorner = results.faceLandmarks?.[359];

      if (
        !forehead ||
        !leftCheek ||
        !chin ||
        !rightCheek ||
        !leftEyeCorner ||
        !rightEyeCorner
      )
        return;

      // Values in pixels
      const foreheadPx = normalizedToPixelCoordinates(
        forehead.x,
        forehead.y,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );
      const leftCheekPx = normalizedToPixelCoordinates(
        leftCheek.x,
        leftCheek.y,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );
      const chinPx = normalizedToPixelCoordinates(
        chin.x,
        chin.y,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );
      const rightCheekPx = normalizedToPixelCoordinates(
        rightCheek.x,
        rightCheek.y,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );
      const rightEyeCornerPx = normalizedToPixelCoordinates(
        rightEyeCorner.x,
        rightEyeCorner.y,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );
      const leftEyeCornerPx = normalizedToPixelCoordinates(
        leftEyeCorner.x,
        leftEyeCorner.y,
        CANVAS_WIDTH,
        CANVAS_HEIGHT
      );

      if (
        !foreheadPx ||
        !leftCheekPx ||
        !chinPx ||
        !rightCheekPx ||
        !rightEyeCornerPx ||
        !leftEyeCornerPx
      )
        return;

        // face width, height: Euclidean distance between 2 points
      // d = √((x2-x1)2 + (y2-y1)2)
      const faceHeight = Math.sqrt(
        Math.pow(chinPx.x_px - foreheadPx.x_px, 2) +
          Math.pow(chinPx.y_px - foreheadPx.y_px, 2)
      );
      const faceWidth = Math.sqrt(
        Math.pow(leftCheekPx.x_px - rightCheekPx.x_px, 2) +
          Math.pow(leftCheekPx.y_px - rightCheekPx.y_px, 2)
      );

      // Render face mask
      wearMask(
        canvasCtx,
        masksArray[activeMask.current],
        leftCheekPx.x_px,
        foreheadPx.y_px,
        faceWidth,
        faceHeight,
        rightEyeCornerPx,
        leftEyeCornerPx,
      ); 
      

      drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_CONTOURS, {
        color: "red",
        lineWidth: 3,
      });
    }

    // Prevents new photos from being taken after having one (resets on send)
    if(photoRef.current) return

   // If no face landmarks cancel recording
   if(!results.faceLandmarks?.length) return setRecording(false)
    
    if(!recording) setRecording(true)
  }

  function renderVertically(image) {
    const helperCanvas = helperCanvasRef.current;
    const canvasCtx = helperCanvas.getContext("2d");

    canvasCtx.save();

    canvasCtx.translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    canvasCtx.rotate((-90 * Math.PI) / 180);
    canvasCtx.scale(1, -1);
    canvasCtx.drawImage(
      image,
      -CANVAS_HEIGHT / 2,
      -CANVAS_WIDTH / 2,
      CANVAS_HEIGHT,
      CANVAS_WIDTH
    );

    canvasCtx.restore();

    return helperCanvas;
  }

  // Init
  useEffect(() => {
    const holistic = new Holistic({
      locateFile: (file) => {
        return `/holistic/${file}`;
      },
    });

    holistic.setOptions({
      selfieMode: true,
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: true,
      smoothSegmentation: true,
      refineFaceLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults(onResults);

    new Camera(document.getElementsByTagName("video")[0], {
      onFrame: async () => {
        const resultImg = renderVertically(
          document.getElementsByTagName("video")[0]
        );

        await holistic.send({ image: resultImg });
      },
      width: DISPLAY_WIDTH,
      height: DISPLAY_HEIGHT,
    }).start();
  }, []);

  return (
    <>
      {recording && countdown && <p style={{position: "absolute", top: "100px", left: "540px", fontSize: "3em"}}>{countdown}</p>}
      <video style={{ display: "none" }} />

      {screenSaver && <VideoScreen width={DISPLAY_HEIGHT} displayHeight={DISPLAY_WIDTH}/> }
      <canvas
        ref={helperCanvasRef}
        style={{ display: "none" }}
        className="helper_canvas"
        width="1080"
        height="1920"
      ></canvas>
      {photoURL && <ResultDisplay type="image" URL={photoURL} submit={submitPhoto}/> }
      <canvas
        ref={canvasRef}
        className="output_canvas"
        width="1080"
        height="1920"
      ></canvas>
    </>
  );
};

export default Face;

function takePhoto(canvasRef,setPhotoURL, photoRef) {
  photoRef.current = canvasRef.current.toDataURL()
  setPhotoURL(canvasRef.current.toDataURL()) 
}


