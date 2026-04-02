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

// src/trigger/extract-frame-task.ts
init_esm();
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
var extractFrameTask = task({
  id: "extract-frame",
  retry: { maxAttempts: 2 },
  run: /* @__PURE__ */ __name(async (payload) => {
    const dir = mkdtempSync(join(tmpdir(), "nf-frame-"));
    const inputPath = join(dir, "input.mp4");
    const outputPath = join(dir, "frame.jpg");
    try {
      const res = await fetch(payload.videoUrl);
      if (!res.ok) throw new Error(`Failed to download video: ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      writeFileSync(inputPath, buffer);
      const ffprobe = process.env.FFPROBE_PATH ?? "ffprobe";
      const ffmpeg = process.env.FFMPEG_PATH ?? "ffmpeg";
      let seekSec;
      if (payload.timestamp.includes("%")) {
        const durationStr = execSync(
          `"${ffprobe}" -v error -show_entries format=duration -of csv=p=0 "${inputPath}"`,
          { encoding: "utf-8" }
        ).trim();
        const duration = parseFloat(durationStr);
        const pct = parseFloat(payload.timestamp.replace("%", ""));
        seekSec = pct / 100 * duration;
      } else {
        seekSec = parseFloat(payload.timestamp) || 0;
      }
      execSync(
        `"${ffmpeg}" -y -ss ${seekSec} -i "${inputPath}" -frames:v 1 -q:v 2 "${outputPath}"`,
        { encoding: "utf-8", stdio: "pipe" }
      );
      const frame = readFileSync(outputPath);
      const result = await uploadToTransloadit(frame, "frame.jpg");
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
  extractFrameTask
};
//# sourceMappingURL=extract-frame-task.mjs.map
