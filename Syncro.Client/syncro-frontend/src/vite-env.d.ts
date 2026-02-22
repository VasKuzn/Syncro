/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_API_BASE_URL: string
    readonly VITE_ENVIRONMENT: 'development' | 'production' | 'staging'
    readonly VITE_USE_HTTPS: string
    readonly VITE_WS_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}