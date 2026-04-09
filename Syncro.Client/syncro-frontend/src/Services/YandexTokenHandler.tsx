// YandexTokenHandler.tsx
import { useEffect, useState } from 'react';

declare global {
    interface Window {
        YaSendSuggestToken?: (origin: string, options?: { flag: boolean }) => void;
    }
}

const YandexTokenHandler = () => {
    const [logs, setLogs] = useState<string[]>([]);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    const addLog = (message: string) => {
        console.log(message);
        setLogs(prev => [...prev, `${new Date().toISOString().slice(11, 23)} - ${message}`]);
    };

    useEffect(() => {
        addLog('YandexTokenHandler mounted');
        addLog(`Current URL: ${window.location.href}`);
        addLog(`Origin: ${window.location.origin}`);

        // Проверяем наличие токена в URL
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get('access_token') || hashParams.get('access_token');
        const error = params.get('error') || hashParams.get('error');

        addLog(`Access token in URL: ${accessToken ? 'Yes (length: ' + accessToken.length + ')' : 'No'}`);
        addLog(`Error in URL: ${error || 'No'}`);

        const scriptId = 'yandex-suggest-token-script';
        let scriptElement = document.getElementById(scriptId) as HTMLScriptElement | null;

        const initTokenHandler = () => {
            addLog('Checking window.YaSendSuggestToken...');
            if (window.YaSendSuggestToken) {
                addLog('YaSendSuggestToken is available, calling with origin: ' + window.location.origin);
                try {
                    window.YaSendSuggestToken(window.location.origin, { flag: true });
                    addLog('YaSendSuggestToken called successfully');
                    setStatus('success');
                } catch (err) {
                    addLog(`Error calling YaSendSuggestToken: ${err}`);
                    setStatus('error');
                }
            } else {
                addLog('YaSendSuggestToken not available yet, retrying in 100ms');
                setTimeout(initTokenHandler, 100);
            }
        };

        if (scriptElement) {
            addLog('Script already loaded, initializing handler');
            initTokenHandler();
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token-latest.js';
        script.async = true;

        script.onload = () => {
            addLog('Yandex suggest-token script loaded');
            initTokenHandler();
        };

        script.onerror = (error) => {
            addLog(`Failed to load Yandex suggest-token script: ${error}`);
            setStatus('error');
        };

        document.head.appendChild(script);
        addLog('Script appended to head');

        // Не удаляем скрипт при размонтировании
    }, []);

    // Временно не закрываем окно, чтобы увидеть логи
    // Если нужно закрыть вручную, можно добавить кнопку

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h2>Обработка авторизации через Яндекс (отладка)</h2>
            <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '5px' }}>
                <strong>Статус:</strong> {status === 'loading' && 'Загрузка...'}
                {status === 'success' && '✅ Успешно (токен отправлен)'}
                {status === 'error' && '❌ Ошибка'}
            </div>
            <div style={{ marginBottom: '20px' }}>
                <button
                    onClick={() => window.close()}
                    style={{ padding: '10px 20px', marginRight: '10px' }}
                >
                    Закрыть окно вручную
                </button>
                <button
                    onClick={() => {
                        const params = new URLSearchParams(window.location.search);
                        const hashParams = new URLSearchParams(window.location.hash.substring(1));
                        const token = params.get('access_token') || hashParams.get('access_token');
                        if (token && window.opener) {
                            window.opener.postMessage({
                                type: 'yandex-auth-complete',
                                status: 'success',
                                access_token: token
                            }, '*');
                            addLog('Manual token sent via postMessage');
                        }
                    }}
                    style={{ padding: '10px 20px' }}
                >
                    Отправить токен вручную
                </button>
            </div>
            <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '5px', padding: '10px', maxHeight: '400px', overflow: 'auto' }}>
                <h3>Логи:</h3>
                {logs.length === 0 ? (
                    <p>Нет логов</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {logs.map((log, idx) => (
                            <li key={idx} style={{ fontFamily: 'monospace', fontSize: '12px', marginBottom: '5px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                                {log}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                Это окно не закроется автоматически для отладки. Нажмите "Закрыть окно вручную" после анализа.
            </p>
        </div>
    );
};

export default YandexTokenHandler;