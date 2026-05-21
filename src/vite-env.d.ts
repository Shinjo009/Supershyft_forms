/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_BASE_URL?: string
  readonly VITE_API_BASE_URL?: string
  readonly VITE_BASE_URL?: string
  readonly VITE_CELEBAL_ENGAGEMENT_CODE_MALE?: string
  readonly VITE_CELEBAL_ENGAGEMENT_CODE_FEMALE?: string
  readonly VITE_RAZORPAY_PAYMENT_LINK_URL?: string
  readonly VITE_SKIP_RAZORPAY?: string
  readonly VITE_PAYMENT_TEST_FAIL?: string
  /** @deprecated Ignored on Celebal form; remove from hosting to avoid CBTW routing. */
  readonly VITE_ENGAGEMENT_CODE?: string
  /** @deprecated Ignored on Celebal form. */
  readonly VITE_CELEBAL_ENGAGEMENT_CODE?: string
  /** @deprecated Ignored on Celebal form. */
  readonly VITE_CBTW_ENGAGEMENT_CODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
