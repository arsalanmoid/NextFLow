import {
  defineConfig
} from "./chunk-UIZXZHB4.mjs";
import "./chunk-VZVAH3GX.mjs";
import {
  init_esm
} from "./chunk-CD6QDZSA.mjs";

// trigger.config.ts
init_esm();
var trigger_config_default = defineConfig({
  project: "proj_voppvbefrhyamgbpkzrp",
  dirs: ["src/trigger"],
  maxDuration: 300,
  retries: {
    default: {
      maxAttempts: 2
    }
  },
  build: {}
});
var resolveEnvVars = void 0;
export {
  trigger_config_default as default,
  resolveEnvVars
};
//# sourceMappingURL=trigger.config.mjs.map
