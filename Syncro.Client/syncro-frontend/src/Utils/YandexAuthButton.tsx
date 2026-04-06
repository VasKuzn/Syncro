// YandexAuthButton.tsx
import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        YaAuthSuggest: any;
    }
}

interface YandexAuthButtonProps {
    baseUrl: string;
    onSuccess: (token: string) => void;
    onError: (error: any) => void;
}

const YandexAuthButton: React.FC<YandexAuthButtonProps> = ({ baseUrl, onSuccess, onError }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Загружаем SDK Яндекса
        const script = document.createElement('script');
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-with-polyfills-latest.js';
        script.async = true;
        script.onload = () => {
            if (window.YaAuthSuggest && containerRef.current) {
                // Замените client_id и redirect_uri на свои
                window.YaAuthSuggest.init(
                    {
                        client_id: 'd1c31a817b354a18af1857c5326982a8',
                        response_type: 'token',
                        redirect_uri: `${baseUrl}/main`, // адрес вспомогательной страницы
                    },
                    `${baseUrl}/login`, // origin страницы логина (без завершающего слеша)
                    {
                        view: "button",
                        parentId: "buttonContainerId",
                        buttonSize: 's',
                        buttonView: 'additional',
                        buttonTheme: 'dark',
                        buttonBorderRadius: "20",
                        buttonIcon: 'ya',
                    }
                )
                    .then((result: any) => result.handler())
                    .then((data: any) => {
                        onSuccess(data.access_token);
                    })
                    .catch(onError);
            }
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, [onSuccess, onError]);

    return <div id="yandex-auth-container" ref={containerRef} />;
};

export default YandexAuthButton;