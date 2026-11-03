interface ImportMetaEnv {
  /** Base URL of the Butch API, only if it isn't on the same origin as the page. */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
