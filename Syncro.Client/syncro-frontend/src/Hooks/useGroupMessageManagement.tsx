// useGroupMessageManagement.ts
import { useState, useRef, useCallback, useEffect } from 'react';
import { PersonalMessageData } from '../Types/ChatTypes';
import { UserInfo } from '../Types/UserInfo';
import { getGroupMessages } from '../Services/GroupService';
import { createMessage, uploadMediaMessage } from '../Services/ChatService';
import useGroupMessagesHub from './UseGroupMessagesHub';

interface UseGroupMessageManagementProps {
    groupId: string | null;
    currentUserId: string | null;
    currentUser: UserInfo | null;
}

export const useGroupMessageManagement = ({
    groupId,
    currentUserId,
    currentUser
}: UseGroupMessageManagementProps, baseUrl: string, csrfToken: string | null) => {
    const [messages, setMessages] = useState<PersonalMessageData[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    const processedMessagesRef = useRef<Set<string>>(new Set());
    const shouldScrollToBottomRef = useRef(false);

    const updateMessage = useCallback((message: PersonalMessageData) => {
        setMessages(prev => {
            const existingIndex = prev.findIndex(m => m.id === message.id);
            if (existingIndex >= 0) {
                const newMessages = [...prev];
                newMessages[existingIndex] = message;
                return newMessages;
            }
            return [...prev, message];
        });
    }, []);

    const loadMessages = useCallback(async () => {
        if (!groupId) return;

        try {
            setIsLoadingMessages(true);
            shouldScrollToBottomRef.current = true;
            const loadedMessages = await getGroupMessages(groupId, baseUrl);
            processedMessagesRef.current.clear();
            setMessages(loadedMessages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [groupId, baseUrl]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const handleNewMessage = useCallback((message: PersonalMessageData) => {
        const messageId = message.id;

        if (processedMessagesRef.current.has(messageId)) {
            return;
        }
        processedMessagesRef.current.add(messageId);

        updateMessage(message);
    }, [updateMessage]);

    const hub = useGroupMessagesHub(groupId, handleNewMessage, baseUrl);

    const handleSend = useCallback(async (text: string, media?: {
        file: File;
        mediaUrl: string;
        mediaType: string;
        fileName: string;
    }) => {
        if (!currentUserId || !groupId) return;

        const tempMessageId = crypto.randomUUID();
        const tempMessage: PersonalMessageData = {
            id: tempMessageId,
            messageContent: text,
            messageDateSent: new Date(),
            accountId: currentUserId,
            accountNickname: currentUser?.nickname || null,
            personalConferenceId: null,
            groupConferenceId: groupId,
            sectorId: null,
            idEdited: false,
            previousMessageContent: null,
            isPinned: false,
            isRead: false,
            referenceMessageId: null,
            mediaUrl: media?.mediaUrl,
            mediaType: media?.mediaType,
            fileName: media?.fileName,
            isEncrypted: false
        };

        setMessages(prev => [...prev, tempMessage]);
        shouldScrollToBottomRef.current = true;

        try {
            if (media?.file) {
                setIsUploading(true);
                await uploadMediaMessage(tempMessageId, {
                    file: media.file,
                    messageContent: text,
                    accountId: currentUserId,
                    accountNickname: currentUser?.nickname || null,
                    groupConferenceId: groupId,
                    isEncrypted: false
                }, baseUrl, csrfToken);
            } else {
                await createMessage(tempMessage, baseUrl, csrfToken);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempMessageId));
        } finally {
            setIsUploading(false);
        }
    }, [currentUserId, groupId, currentUser, baseUrl, csrfToken]);

    return {
        messages,
        setMessages,
        isUploading,
        isLoadingMessages,
        loadMessages,
        handleSend,
        shouldScrollToBottomRef,
        hub // возвращаем hub для доступа к методам печати
    };
};