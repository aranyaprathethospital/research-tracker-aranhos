const acceptedAvatarTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_AVATAR_SIDE = 512;

function encode(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("เตรียมไฟล์รูปภาพไม่สำเร็จ"));
    }, type, quality);
  });
}

export async function prepareAvatar(file: File) {
  if (!acceptedAvatarTypes.has(file.type) || !file.size) {
    throw new Error("กรุณาเลือกรูป JPG, PNG หรือ WebP");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("อ่านรูปภาพไม่ได้ กรุณาเลือกไฟล์ใหม่");
  }
  try {
    const scale = Math.min(1, MAX_AVATAR_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("เตรียมรูปโปรไฟล์ไม่สำเร็จ");
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await encode(canvas, "image/webp", 0.8);
    if (scale === 1 && file.size <= blob.size && file.size <= 5 * 1024 * 1024) return file;
    return new File([blob], blob.type === "image/webp" ? "avatar.webp" : "avatar.png", { type: blob.type });
  } finally {
    bitmap.close();
  }
}

export async function cropDrawnSignature(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("อ่านลายเซ็นไม่ได้");
  const { width, height } = canvas;
  const { data } = context.getImageData(0, 0, width, height);
  let left = width;
  let right = -1;
  let top = height;
  let bottom = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!data[(y * width + x) * 4 + 3]) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < 0) throw new Error("กรุณาวาดลายเซ็นก่อนบันทึก");

  const padding = 12;
  const inkWidth = right - left + 1;
  const inkHeight = bottom - top + 1;
  const cropped = document.createElement("canvas");
  cropped.width = inkWidth + padding * 2;
  cropped.height = inkHeight + padding * 2;
  const output = cropped.getContext("2d");
  if (!output) throw new Error("สร้างไฟล์ลายเซ็นไม่สำเร็จ");
  output.drawImage(canvas, left, top, inkWidth, inkHeight, padding, padding, inkWidth, inkHeight);
  const blob = await encode(cropped, "image/png");
  return new File([blob], "signature.png", { type: "image/png" });
}
