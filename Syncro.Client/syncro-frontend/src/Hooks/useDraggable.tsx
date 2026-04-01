import { useEffect, useRef, RefObject } from 'react';

export const UseDraggable = (
    elementRef: RefObject<HTMLElement | null>,
    enabled: boolean = true
) => {
    const dragOffsetRef = useRef({ x: 0, y: 0 });
    const isDraggingRef = useRef(false);

    useEffect(() => {
        if (!enabled || !elementRef.current) return;

        const element = elementRef.current;
        const parent = element.parentElement;
        if (!parent) return;

        const handleMouseDown = (e: MouseEvent) => {
            e.preventDefault();
            isDraggingRef.current = true;

            const rect = element.getBoundingClientRect();
            const parentRect = parent.getBoundingClientRect();

            dragOffsetRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
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
    }, [enabled, elementRef]);
};