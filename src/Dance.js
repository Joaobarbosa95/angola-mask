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

import VideoDisplay from "./ResultDisplay";

// Utils
import { blobToBase64 } from "./utils/blobToBase64";

// Constants
const DISPLAY_WIDTH = 1920;
const DISPLAY_HEIGHT = 1080;

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

const SCREEN_SAVER_TIMEOUT_TIME = 5000; // 5s
const VIDEO_RECORD_TIME = 5000 // 5s
const COUNTDOWN_TIME = 5 // 5s

const URL = ""

const Dance = function () {
  const canvasRef = useRef(null);
  const helperCanvasRef = useRef(null);

  const [startCountdown, setStartCountdown] = useState(false)
  const recordingRef = useRef(false)
  const [videoURL, setVideoURL] = useState(null)
  const [countdown, setCountdown] = useState(COUNTDOWN_TIME)
  const videoRef = useRef(null)

  const [screenSaver, setScreenSaver] = useState(false)
  const timeoutTimer = useRef(false)

  function submitVideo(e) {
    e.preventDefault()

    // If uncommented countdown doesn't work
    // const base64Data = await blobToBase64(videoBlob)
     
    // Has data:/;base64 in front of the string
    // Remove if needed
    // const base64 = base64Data.split(',')[1];
    
    // fetch(URL, {
    //   method: "POST",
    //   body: {
    //     email: e.target.username.value,
    //     video: base64Data
    //   }
    // })
    
    window.URL.revokeObjectURL(videoURL)
    
    console.log("Sent")

    setVideoURL(null)
    setCountdown(COUNTDOWN_TIME)
    setStartCountdown(false)
    recordingRef.current = false
    videoRef.current = null
  }

  useEffect(() => {
    if(!startCountdown) return
  
    const timer = setInterval(() => {
      setCountdown(countdown => {
        if(countdown === 1) {
          recordingRef.current = true
          startVideoRecorder(canvasRef.current, setVideoURL, videoRef)
          clearInterval(timer)      
          return
        }

        return countdown - 1
      })
    }, 1000)  

    return () => {
      clearInterval(timer)
      setCountdown(COUNTDOWN_TIME)
    }
  }, [startCountdown])
  
  // Results
  function onResults(results) {
    // Set canvas width
    const canvasCtx = canvasRef.current.getContext("2d");
    
    // if(videoRef.current) return results
    // // if no face landmarks detected
    // // and screen saver is not set 
    // if(results.faceLandmarks?.length) {
    //  clearTimeout(timeoutTimer.current)
    //  timeoutTimer.current  = false 
    //  setScreenSaver(false)
    // } else if (!timeoutTimer.current) {
    //   timeoutTimer.current = setTimeout(() => {
    //     setScreenSaver(true)
    //   }, SCREEN_SAVER_TIMEOUT_TIME)
    // } 
    
    canvasCtx.save()
    canvasCtx.clearRect(0,0, DISPLAY_HEIGHT, DISPLAY_WIDTH)
    canvasCtx.drawImage(results.image, 0, 0, DISPLAY_HEIGHT, DISPLAY_WIDTH);      
    canvasCtx.restore()
    
    drawConnectors(canvasCtx, results.faceLandmarks, FACEMESH_CONTOURS, {
      color: "red",
      lineWidth: 3,
    });
    
    // Mediapipe can't render side face landmarks
    // So everytime a person turn their heads
    // The countdown will reset
    // Solution: use Pose landmarks
    if(!results.faceLandmarks?.length && !recordingRef.current) return setStartCountdown(false)
    if(!recordingRef.current) setStartCountdown(true)
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
      modelComplexity: 0,
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
      {startCountdown && countdown && <p style={{position: "absolute", top: "100px", left: "540px", fontSize: "3em"}}>{countdown}</p>}
      <video style={{ display: "none" }} />
      {screenSaver && <VideoScreen width={DISPLAY_HEIGHT} displayHeight={DISPLAY_WIDTH}/> }
      <canvas
        ref={helperCanvasRef}
        style={{ display: "none" }}
        className="helper_canvas"
        width="1080"
        height="1920"
      ></canvas> 
        {videoURL && <VideoDisplay type="video" URL={videoURL} submit={submitVideo}/>}
      <canvas
        ref={canvasRef}
        className="output_canvas"
        width="1080"
        height="1920"
      ></canvas>
    </>
  );
};

export default Dance;

function startVideoRecorder(canvas, setVideoURL, videoRef) {
    const videoStream = canvas.captureStream(120);
    const mediaRecorder = new MediaRecorder(videoStream);

    let chunks = [];
    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = async function(e) {
    const blob = new Blob(chunks, { 'type' : 'video/mp4' });
    chunks = null;
    
    const videoURL = window.URL.createObjectURL(blob);

    setVideoURL(videoURL)
    videoRef.current = blob

    console.log("RECORDED")
    };

    mediaRecorder.ondataavailable = function(e) {
      chunks.push(e.data);
    };

    mediaRecorder.start();
    setTimeout(function (){ mediaRecorder.stop(); }, VIDEO_RECORD_TIME);
}
