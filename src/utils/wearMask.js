export function wearMask(
  imgUrl,
  x,
  y,
  width,
  height,
  canvasCtx,
  rightEyeCornerPx,
  leftEyeCornerPx
) {
  const img = document.createElement("img");
  img.src = imgUrl;

  const roll = Math.atan2(
    rightEyeCornerPx.y_px - leftEyeCornerPx.y_px,
    rightEyeCornerPx.x_px - leftEyeCornerPx.x_px
  );

  //  canvasCtx.translate(width / 2, height / 2);
  //   canvasCtx.rotate((-90 * Math.PI) / 180);
  //   canvasCtx.scale(1, -1);

  canvasCtx.save();

  canvasCtx.translate(x + width / 2, y + height / 2);
  canvasCtx.rotate(roll * -0.5);
  canvasCtx.rotate((-90 * Math.PI) / 180);
  canvasCtx.scale(1, -1);
  canvasCtx.drawImage(img, -width / 2, -height / 2, width, height);

  canvasCtx.restore();
}
