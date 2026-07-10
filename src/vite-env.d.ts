/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Public base URL of the Sketch2TikZ AI FastAPI backend (IBM Code Engine).
   * e.g. https://sketch2tikz-backend.xxxx.us-south.codeengine.appdomain.cloud
   * Falls back to "/api" when unset, for same-origin reverse-proxy setups.
   */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
