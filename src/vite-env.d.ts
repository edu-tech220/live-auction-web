/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API (sin "/" final). Por defecto http://localhost:5080. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
