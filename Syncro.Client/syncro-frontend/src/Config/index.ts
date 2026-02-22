interface Config {
    apiUrl: string;
    environment: 'development' | 'production' | 'staging';
    useHttps: boolean;
    wsUrl: string;
    isDevelopment: boolean;
    isProduction: boolean;
}

export const config: Config = {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5232',
    environment: (import.meta.env.VITE_ENVIRONMENT as Config['environment']) || 'development',
    useHttps: import.meta.env.VITE_USE_HTTPS === 'true',
    wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:5232',

    isDevelopment: import.meta.env.DEV, // встроенный флаг Vite
    isProduction: import.meta.env.PROD, // встроенный флаг Vite
};

// Для отладки - покажет в консоли, какие переменные загружены
if (config.isDevelopment) {
    console.log('🔧 Config loaded:', config);
}