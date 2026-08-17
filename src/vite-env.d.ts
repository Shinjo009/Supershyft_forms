/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_BASE_URL?: string
  readonly VITE_ENGAGEMENT_CODE?: string
  readonly VITE_ENGAGEMENT_CODE_PUNE_MALE?: string
  readonly VITE_ENGAGEMENT_CODE_PUNE_FEMALE?: string
  readonly VITE_ENGAGEMENT_CODE_BANGALORE_MALE?: string
  readonly VITE_ENGAGEMENT_CODE_BANGALORE_FEMALE?: string
  readonly VITE_ENGAGEMENT_CODE_GURUGRAM_MALE?: string
  readonly VITE_ENGAGEMENT_CODE_GURUGRAM_FEMALE?: string
  readonly VITE_ENGAGEMENT_CODE_HYDERABAD_MALE?: string
  readonly VITE_ENGAGEMENT_CODE_HYDERABAD_FEMALE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
