export function wearMask(
  canvasCtx,
  imgUrl,
  x,
  y,
  width,
  height,
  rightEyeCornerPx,
  leftEyeCornerPx,
) {
  const img = document.createElement("img");
  img.src = imgUrl;

  const roll = Math.atan2(
    rightEyeCornerPx.y_px - leftEyeCornerPx.y_px,
    rightEyeCornerPx.x_px - leftEyeCornerPx.x_px
  );

  canvasCtx.save();
  canvasCtx.translate(x + width / 2, y + height / 2);
  canvasCtx.rotate(roll * 0.9);

  canvasCtx.drawImage(img, -width / 2, -height / 2, width, height);

  canvasCtx.restore();
}
