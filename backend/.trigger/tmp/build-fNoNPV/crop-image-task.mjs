import {
  uploadToTransloadit
} from "./chunk-VAEICCE6.mjs";
import {
  task
} from "./chunk-UIZXZHB4.mjs";
import "./chunk-VZVAH3GX.mjs";
import {
  __name,
  init_esm
} from "./chunk-CD6QDZSA.mjs";

// src/trigger/crop-image-task.ts
init_esm();
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
var cropImageTask = task({
  id: "crop-image",
  retry: { maxAttempts: 2 },
  run: /* @__PURE__ */ __name(async (payload) => {
    const dir = mkdtempSync(join(tmpdir(), "nf-crop-"));
    const inputPath = join(dir, "input.jpg");
    const outputPath = join(dir, "output.jpg");
    try {
      const res = await fetch(payload.imageUrl);
      if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(inputPath, buffer);
      const ffprobe = process.env.FFPROBE_PATH ?? "ffprobe";
      const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
      const probeOut = execSync(
        `"${ffprobe}" -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${inputPath}"`,
        { encoding: "utf-8" }
      ).trim();
      const [imgW, imgH] = probeOut.split("x").map(Number);
      const x = Math.round(payload.xPercent / 100 * imgW);
      const y = Math.round(payload.yPercent / 100 * imgH);
      const w = Math.round(payload.widthPercent / 100 * imgW);
      const h = Math.round(payload.heightPercent / 100 * imgH);
      execSync(
        `"${ffmpeg}" -y -i "${inputPath}" -vf "crop=${w}:${h}:${x}:${y}" "${outputPath}"`,
        { encoding: "utf-8", stdio: "pipe" }
      );
      const cropped = readFileSync(outputPath);
      const result = await uploadToTransloadit(cropped, "cropped.jpg");
      return { output: result.ssl_url };
    } finally {
      try {
        unlinkSync(inputPath);
      } catch {
      }
      try {
        unlinkSync(outputPath);
      } catch {
      }
    }
  }, "run")
});
export {
  cropImageTask
};
//# sourceMappingURL=crop-image-task.mjs.map
