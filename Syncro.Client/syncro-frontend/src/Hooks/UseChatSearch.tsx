import { useState, useCallback, useEffect } from 'react';
import { PersonalMessageData } from '../Types/ChatTypes';

export const useChatSearch = (messages: PersonalMessageData[]) => {
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<number[]>([]);
    const [currentResultIndex, setCurrentResultIndex] = useState(-1);

    const performSearch = useCallback((query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setCurrentResultIndex(-1);
            return;
        }

        const results: number[] = [];
        const lowerQuery = query.toLowerCase();

        messages.forEach((msg, index) => {
            if (msg.messageContent?.toLowerCase().includes(lowerQuery)) {
                results.push(index);
            }
        });

        setSearchResults(results);
        setCurrentResultIndex(results.length > 0 ? 0 : -1);
    }, [messages]);

    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery, performSearch]);

    const goToNextResult = useCallback(() => {
        if (searchResults.length === 0) return;

        const nextIndex = (currentResultIndex + 1) % searchResults.length;
        setCurrentResultIndex(nextIndex);
    }, [searchResults, currentResultIndex]);

    const goToPrevResult = useCallback(() => {
        if (searchResults.length === 0) return;

        const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
        setCurrentResultIndex(prevIndex);
    }, [searchResults, currentResultIndex]);

    const handleExitSearch = useCallback(() => {
        setIsSearchActive(false);
        setSearchQuery('');
        setSearchResults([]);
        setCurrentResultIndex(-1);
    }, []);

    const scrollToResult = useCallback((resultIndex: number, messageRefs: Map<number, HTMLDivElement>) => {
        if (resultIndex < 0 || resultIndex >= searchResults.length) return;

        const messageIndex = searchResults[resultIndex];
        const messageElement = messageRefs.get(messageIndex);

        if (messageElement) {
            messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            messageElement.classList.add('highlighted');
            setTimeout(() => {
                messageElement.classList.remove('highlighted');
            }, 2000);
        }
    }, [searchResults]);

    return {
        isSearchActive,
        setIsSearchActive,
        searchQuery,
        setSearchQuery,
        searchResults,
        currentResultIndex,
        setCurrentResultIndex,
        goToNextResult,
        goToPrevResult,
        handleExitSearch,
        scrollToResult
    };
};