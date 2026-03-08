import { useState, useCallback } from "react";

export const useFormDelta = <T extends Record<string, any>>(initialData: T) => {
    const [originalData] = useState<T>(initialData);
    const [currentData, setCurrentData] = useState<T>(initialData);

    /**
     * Вычисляет дельту (только изменённые поля)
     */
    const getDelta = useCallback((): Partial<T> => {
        const delta: Partial<T> = {};

        (Object.keys(currentData) as Array<keyof T>).forEach((key) => {
            if (originalData[key] !== currentData[key]) {
                delta[key] = currentData[key];
            }
        });

        return delta;
    }, [originalData, currentData]);

    /**
     * Проверяет, были ли вообще изменения
     */
    const hasChanges = useCallback((): boolean => {
        return Object.keys(getDelta()).length > 0;
    }, [getDelta]);

    /**
     * Обновляет одно или несколько полей
     */
    const updateField = useCallback(<K extends keyof T>(
        key: K,
        value: T[K]
    ) => {
        setCurrentData((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    /**
     * Обновляет несколько полей сразу
     */
    const updateFields = useCallback((updates: Partial<T>) => {
        setCurrentData((prev) => ({
            ...prev,
            ...updates,
        }));
    }, []);

    /**
     * Сбрасывает все изменения
     */
    const resetChanges = useCallback(() => {
        setCurrentData(originalData);
    }, [originalData]);

    return {
        currentData,
        getDelta,
        hasChanges,
        updateField,
        updateFields,
        resetChanges,
        getChangedFields: () => Object.keys(getDelta()) as Array<keyof T>,
    };
};
