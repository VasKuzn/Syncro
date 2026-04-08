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
        console.log('YandexAuthButton useEffect started');
        
        const scriptId = 'yandex-auth-script';
        let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;
        
        // Если скрипт уже загружен
        if (scriptElement) {
            console.log('Script already loaded, initializing button');
            initButton();
            return;
        }

        // Загружаем скрипт
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-latest.js';
        script.async = true;
        
        script.onload = () => {
            console.log('Yandex script loaded successfully');
            initButton();
        };
        
        script.onerror = (error) => {
            console.error('Failed to load Yandex SDK:', error);
            onError(new Error('Failed to load Yandex SDK'));
        };
        
        document.head.appendChild(script);
        console.log('Script appended to head');

        function initButton() {
            console.log('initButton called');
            console.log('window.YaAuthSuggest:', window.YaAuthSuggest);
            
            if (!window.YaAuthSuggest) {
                console.log('YaAuthSuggest not available yet, retrying...');
                setTimeout(initButton, 200);
                return;
            }

            console.log('Initializing YaAuthSuggest with params:', {
                client_id: 'd1c31a817b354a18af1857c5326982a8',
                response_type: 'token',
                redirect_uri: `${baseUrl}/yandex-token`,
                tokenPageOrigin: baseUrl,
                containerId,
            });

            window.YaAuthSuggest.init(
                {
                    client_id: 'd1c31a817b354a18af1857c5326982a8',
                    response_type: 'token',
                    redirect_uri: `${baseUrl}/yandex-token`,
                },
                baseUrl,
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
                .then((result: any) => {
                    console.log('YaAuthSuggest.init success, result:', result);
                    return result.handler();
                })
                .then((data: any) => {
                    console.log('Handler result:', data);
                    if (data?.access_token) {
                        onSuccess(data.access_token);
                    }
                })
                .catch((error: any) => {
                    console.error('Full Yandex auth error:', error);
                    onError(error);
                });
        }
    }, [baseUrl, onSuccess, onError]);

    return <div id={containerId} style={{ minHeight: '48px' }} />;
};

export default YandexAuthButton;