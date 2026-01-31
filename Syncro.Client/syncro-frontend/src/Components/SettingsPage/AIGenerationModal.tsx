import React, { useState } from 'react';

interface AIGenerationModalProps {
    onGenerate: (file: File) => void;
    onClose: () => void;
}

const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
    onGenerate,
    onClose
}) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Введите описание для генерации');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedImageUrl(null);

        try {
            const response = await fetch("https://syncro-ai-worker.christine-likova.workers.dev", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt: prompt.trim() })
            });

            if (!response.ok) {
                throw new Error(`Ошибка генерации: ${response.status}`);
            }

            const blob = await response.blob();

            // Создаем URL для предпросмотра
            const imageUrl = URL.createObjectURL(blob);
            setGeneratedImageUrl(imageUrl);

            // Создаем File объект из blob
            const fileName = `ai-avatar-${Date.now()}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            onGenerate(file);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка при генерации изображения');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = () => {
        if (generatedImageUrl) {
            onClose();
        }
    };

    return (
        <div className="ai-modal-overlay">
            <div className="ai-modal">
                <div className="ai-modal-header">
                    <h2>AI генерация аватара</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="ai-modal-content">
                    <div className="prompt-input-group">
                        <label htmlFor="prompt">Опишите желаемый аватар:</label>
                        <textarea
                            id="prompt"
                            className="prompt-input"
                            placeholder="Например: стильный робот в костюме, космический кот, минималистичный портрет..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">{error}</div>
                    )}

                    <button
                        className="generate-btn"
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                    >
                        {isLoading ? 'Генерация...' : 'Сгенерировать'}
                    </button>

                    {isLoading && (
                        <div className="loading-indicator">
                            <div className="spinner"></div>
                            <p>Генерируем аватар... Это может занять несколько секунд</p>
                        </div>
                    )}

                    {generatedImageUrl && (
                        <div className="generated-preview">
                            <h3>Результат:</h3>
                            <img
                                src={generatedImageUrl}
                                alt="Сгенерированный аватар"
                                className="preview-image"
                            />
                            <div className="preview-actions">
                                <button
                                    className="confirm-btn"
                                    onClick={handleConfirm}
                                >
                                    Использовать этот аватар
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIGenerationModal;