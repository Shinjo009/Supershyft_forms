/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_BASE_URL?: string
  readonly VITE_ENGAGEMENT_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
