import React, { useState, useCallback, useEffect, useRef } from 'react';

interface AudioFilters {
    echoCancellation: boolean;
    noiseSuppression: boolean;
    autoGainControl: boolean;
}

interface CallSettingsProps {
    onVolumeChange: (volume: number) => void;
    onQualityChange: (quality: 'low' | 'medium' | 'high') => void;
    onAudioFiltersChange: (filters: AudioFilters) => void;
    currentQuality: 'low' | 'medium' | 'high';
    currentVolume: number;
    currentFilters: AudioFilters;
}

const CallSettings: React.FC<CallSettingsProps> = ({
    onVolumeChange,
    onQualityChange,
    onAudioFiltersChange,
    currentQuality,
    currentVolume,
    currentFilters
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [volume, setVolume] = useState(currentVolume);
    const [filters, setFilters] = useState<AudioFilters>(currentFilters);
    const settingsPanelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setVolume(currentVolume);
    }, [currentVolume]);

    useEffect(() => {
        setFilters(currentFilters);
    }, [currentFilters]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsPanelRef.current && !settingsPanelRef.current.contains(event.target as Node)) {
                const settingsBtn = document.querySelector('.settings-btn');
                if (settingsBtn && !settingsBtn.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value) / 100;
        setVolume(newVolume);
        onVolumeChange(newVolume);
    }, [onVolumeChange]);

    const handleFilterChange = useCallback((filterName: keyof AudioFilters) => {
        const newFilters = {
            ...filters,
            [filterName]: !filters[filterName]
        };
        setFilters(newFilters);
        onAudioFiltersChange(newFilters);
    }, [filters, onAudioFiltersChange]);

    const qualityLabels = {
        'low': '480p (низкое качество)',
        'medium': '720p (среднее качество)',
        'high': '1080p (высокое качество)'
    };

    return (
        <>
            <button
                className="control-btn settings-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Настройки звонка"
            >
                <img src="/settings_icon.png" alt="Settings" className="icon" />
            </button>

            {isOpen && (
                <div
                    ref={settingsPanelRef}
                    className="call-settings-panel"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="settings-header">
                        <h4>Настройки звонка</h4>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>✕</button>
                    </div>

                    <div className="settings-section">
                        <label>Громкость микрофона: {Math.round(volume * 100)}%</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={volume * 100}
                            onChange={handleVolumeChange}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                            className="volume-slider"
                        />
                    </div>

                    <div className="settings-section">
                        <label>Качество видео:</label>
                        <select
                            value={currentQuality}
                            onChange={(e) => onQualityChange(e.target.value as any)}
                            className="quality-select"
                        >
                            <option value="low">480p (Экономия)</option>
                            <option value="medium">720p (Обычный режим)</option>
                            <option value="high">1080p (Режим высокого качества)</option>
                        </select>
                        <div className="quality-info">
                            <small>{qualityLabels[currentQuality]}</small>
                        </div>
                    </div>

                    <div className="settings-section">
                        <label>Аудио фильтры:</label>
                        <div className="filters-group">
                            <label className="filter-option">
                                <input
                                    type="checkbox"
                                    checked={filters.echoCancellation}
                                    onChange={() => handleFilterChange('echoCancellation')}
                                />
                                <span>Подавление эха</span>
                            </label>
                            <label className="filter-option">
                                <input
                                    type="checkbox"
                                    checked={filters.noiseSuppression}
                                    onChange={() => handleFilterChange('noiseSuppression')}
                                />
                                <span>Шумоподавление</span>
                            </label>
                            <label className="filter-option">
                                <input
                                    type="checkbox"
                                    checked={filters.autoGainControl}
                                    onChange={() => handleFilterChange('autoGainControl')}
                                />
                                <span>Автоматическая регулировка громкости</span>
                            </label>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CallSettings;