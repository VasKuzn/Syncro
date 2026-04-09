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
    const containerId = 'yandex-auth-button-container';
    const initialized = useRef(false);

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        const scriptId = 'yandex-auth-script';
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

        const initButton = () => {
            if (!window.YaAuthSuggest) {
                setTimeout(initButton, 200);
                return;
            }

            window.YaAuthSuggest.init(
                {
                    client_id: 'd1c31a817b354a18af1857c5326982a8',
                    response_type: 'token',
                    redirect_uri: `${window.location.origin}/yandex-token`,
                },
                window.location.origin,
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
                    } else {
                        onError(new Error('No access_token in response'));
                    }
                })
                .catch((error: any) => {
                    if (error?.code !== 'in_progress') {
                        onError(error);
                    }
                });
        };

        if (existingScript) {
            initButton();
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-latest.js';
        script.async = true;
        script.onload = initButton;
        script.onerror = () => onError(new Error('Failed to load Yandex SDK'));
        document.head.appendChild(script);
    }, [onSuccess, onError]);

    return <div id={containerId} style={{ minHeight: '48px', display: 'inline-block', width: '15%' }} />;
};

export default YandexAuthButton;