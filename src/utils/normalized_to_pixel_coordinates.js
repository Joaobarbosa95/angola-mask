export function normalizedToPixelCoordinates(normalizedX, normalizedY, imgWidth, imgHeight) {
 // Check if value is normalized
        
 if(!isValidNormalizedValue(normalizedX) || !isValidNormalizedValue(normalizedY)) return null

 // add face outside screen handler
 
 const x_px = Math.min(Math.floor(normalizedX * imgWidth), imgWidth - 1)
 const y_px = Math.min(Math.floor(normalizedY * imgHeight), imgHeight - 1) 

 return {x_px, y_px}
}


function isValidNormalizedValue(value) {
    return(value >= 0 && value <=1)
}
