import React from 'react'

const VideoScreen = ({displayWidth, displayHeight}) => {
  return <video style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: displayWidth,
            height: displayHeight,
          }} autoPlay muted loop playsInline src="screenSaver.webm" crossOrigin='anonymous' ></video>   
  
}

export default VideoScreen