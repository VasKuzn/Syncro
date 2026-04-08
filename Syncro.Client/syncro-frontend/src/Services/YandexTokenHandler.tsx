import { useEffect } from 'react';

const YandexTokenHandler = () => {
    useEffect(() => {
        // Загружаем Yandex скрипт для обработки токена
        const script = document.createElement('script');
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token.js';
        script.async = true;
        document.body.appendChild(script);

        // Обрабатываем токен из URL параметров
        const handleToken = () => {
            try {
                console.log('handleToken called, location:', window.location.href);

                // Получаем access_token из query параметров или хеша
                const params = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.substring(1));

                const accessToken = params.get('access_token') || hashParams.get('access_token');
                const error = params.get('error') || hashParams.get('error');
                const errorDescription = params.get('error_description') || hashParams.get('error_description');

                console.log('Token found:', !!accessToken, 'Error found:', !!error);

                if (error) {
                    console.error('Yandex OAuth error:', error, errorDescription);
                    if (window.opener) {
                        window.opener.postMessage(
                            {
                                type: 'yandex-auth-complete',
                                status: 'error',
                                error: error,
                                errorDescription: errorDescription
                            },
                            '*'
                        );
                    }
                    setTimeout(() => {
                        console.log('Closing window due to error');
                        window.close();
                    }, 2000);
                    return;
                }

                if (!accessToken) {
                    console.warn('No access token found in URL, waiting...');
                    return;
                }

                console.log('Got access token from Yandex, length:', accessToken.length);

                // Отправляем токен в родительское окно
                if (window.opener) {
                    console.log('window.opener exists:', !!window.opener);
                    console.log('window.opener location:', window.opener.location.href);

                    const messagePayload = {
                        type: 'yandex-auth-complete',
                        status: 'success',
                        access_token: accessToken
                    };

                    console.log('Sending postMessage with payload:', messagePayload);
                    console.log('Target origin: *');

                    window.opener.postMessage(messagePayload, '*');
                    console.log('✅ postMessage sent successfully');

                    // Закрываем окно через 1 секунду
                    setTimeout(() => {
                        console.log('Closing popup window');
                        window.close();
                    }, 5000);
                } else {
                    console.error('No parent window found - not in popup');
                    // Если это не popup, то просто показываем сообщение
                    if (accessToken) {
                        console.log('Token available but no parent window');
                    }
                }
            } catch (error) {
                console.error('Error handling Yandex token:', error);
                if (window.opener) {
                    window.opener.postMessage(
                        {
                            type: 'yandex-auth-complete',
                            status: 'error',
                            error: 'Failed to process token',
                            errorDetails: String(error)
                        },
                        '*'
                    );
                }
                setTimeout(() => window.close(), 2000);
            }
        };

        // Пытаемся обработать токен сразу и через небольшую задержку (для асинхронного редиректа)
        console.log('Setting up token handler');
        handleToken();
        const timeoutId = setTimeout(handleToken, 500);

        return () => {
            clearTimeout(timeoutId);
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
        };
    }, []);

    return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
            <h2>Обработка авторизации через Яндекс...</h2>
            <p>Это окно автоматически закроется после успешной авторизации.</p>
            <p style={{ fontSize: '12px', color: '#666' }}>Если окно не закрывается, проверьте консоль браузера.</p>
        </div>
    );
};

export default YandexTokenHandler;