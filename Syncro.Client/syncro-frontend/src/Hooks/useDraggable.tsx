// hooks/useDraggable.ts
import { useRef, useEffect } from 'react';

export const useDraggable = (enabled: boolean = true) => {
    const elementRef = useRef<HTMLVideoElement>(null);
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    useEffect(() => {
        if (!enabled || !elementRef.current) return;

        const element = elementRef.current;
        const parent = element.parentElement;
        if (!parent) return;

        const handleMouseDown = (e: MouseEvent) => {
            // Проверяем, что клик был по drag-handle
            if (!(e.target as HTMLElement).closest('.drag-handle')) return;

            e.preventDefault();
            isDraggingRef.current = true;

            const rect = element.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();

            dragOffsetRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            element.style.transition = 'none';
            element.style.cursor = 'grabbing';
            element.style.userSelect = 'none';
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;

            e.preventDefault();

            const parentRect = parent.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();

            let newX = e.clientX - dragOffsetRef.current.x - parentRect.left;
            let newY = e.clientY - dragOffsetRef.current.y - parentRect.top;

            // Ограничения в пределах контейнера
            newX = Math.max(0, Math.min(newX, parentRect.width - elementRect.width));
            newY = Math.max(0, Math.min(newY, parentRect.height - elementRect.height));

            element.style.position = 'absolute';
            element.style.left = `${newX}px`;
            element.style.top = `${newY}px`;
            element.style.right = 'auto';
            element.style.bottom = 'auto';
            element.style.zIndex = '100';
        };

        const handleMouseUp = () => {
            if (!isDraggingRef.current) return;

            isDraggingRef.current = false;
            element.style.transition = '';
            element.style.cursor = '';
            element.style.userSelect = '';
        };

        element.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            element.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [enabled]);

    return elementRef;
};