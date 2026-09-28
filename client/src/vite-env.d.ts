interface ImportMetaEnv {
  /** Base URL of the Butch API in production, e.g. https://butch-api.onrender.com */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
