import React, { useRef } from 'react';

interface SettingsAddAvatarComponentProps {
    onFileSelect: (file: File) => void;
    onAIGenerate: () => void;
    onClose: () => void;
    fileInputRef?: React.RefObject<HTMLInputElement | null>; // Изменяем тип
}

const SettingsAddAvatarComponent: React.FC<SettingsAddAvatarComponentProps> = ({
    onFileSelect,
    onAIGenerate,
    onClose,
    fileInputRef
}) => {
    const internalRef = useRef<HTMLInputElement>(null);
    const currentRef = fileInputRef || internalRef;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    const handleSelectFileClick = () => {
        currentRef.current?.click();
    };

    return (
        <div className="avatar-modal-overlay">
            <div className="avatar-modal">
                <div className="avatar-modal-header">
                    <h2>Сменить аватар</h2>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>

                <div className="avatar-modal-content">
                    <input
                        type="file"
                        ref={currentRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />

                    <button
                        className="avatar-modal-btn file-btn"
                        onClick={handleSelectFileClick}
                    >
                        Выбрать файл с устройства
                    </button>

                    <button
                        className="avatar-modal-btn ai-btn"
                        onClick={onAIGenerate}
                    >
                        AI генерация
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsAddAvatarComponent;