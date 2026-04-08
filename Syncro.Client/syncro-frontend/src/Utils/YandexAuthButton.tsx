import { useEffect } from 'react';

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
    const containerId = 'yandex-auth-button-container';

    useEffect(() => {
        // Загружаем скрипт один раз
        const scriptId = 'yandex-auth-script';
        if (document.getElementById(scriptId)) {
            initButton();
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-latest.js';
        script.async = true;
        script.onload = initButton;
        script.onerror = () => {
            console.error('Failed to load Yandex SDK');
            onError(new Error('Failed to load Yandex SDK'));
        };
        document.head.appendChild(script);

        function initButton() {
            if (!window.YaAuthSuggest) {
                setTimeout(initButton, 100);
                return;
            }

            window.YaAuthSuggest.init(
                {
                    client_id: 'd1c31a817b354a18af1857c5326982a8',
                    response_type: 'token',
                    redirect_uri: `${baseUrl}/main`,
                },
                `${baseUrl}/login`,
                {
                    view: 'button',
                    parentId: containerId,
                    buttonSize: 's',
                    buttonView: 'additional',
                    buttonTheme: 'dark',
                    buttonBorderRadius: 20,
                    buttonIcon: 'ya',
                }
            )
                .then((result: any) => result.handler())
                .then((data: any) => {
                    if (data?.access_token) {
                        onSuccess(data.access_token);
                    }
                })
                .catch((error: any) => {
                    console.error('Yandex auth error:', error);
                    onError(error);
                });
        }
    }, [baseUrl, onSuccess, onError]);

    return <div id={containerId} />;
};

export default YandexAuthButton;