// CsrfProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { config } from '../Config';

interface CsrfContextType {
    csrfToken: string | null;
    baseUrl: string;
    refreshCsrfToken: () => Promise<void>;
}

const CsrfContext = createContext<CsrfContextType | undefined>(undefined);

export const useCsrf = () => {
    const context = useContext(CsrfContext);
    if (!context) {
        throw new Error('useCsrf must be used within CsrfProvider');
    }
    return context;
};

export const CsrfProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [csrfToken, setCsrfTokenState] = useState<string | null>(null);

    const baseUrl = config.apiUrl;

    const fetchCsrfToken = async () => {
        try {
            const response = await fetch(`${baseUrl}/api/security/csrf-token`, {
                credentials: 'include'
            });

            const data = await response.json();
            setCsrfTokenState(data.token);
        } catch (error) {
            console.error('Failed to fetch CSRF token:', error);
        }
    };

    useEffect(() => {
        fetchCsrfToken();
    }, []);

    return (
        <CsrfContext.Provider value={{ csrfToken, baseUrl, refreshCsrfToken: fetchCsrfToken }}>
            {children}
        </CsrfContext.Provider>
    );
};