import { useState, useRef, useCallback, useEffect } from 'react';
import { PersonalMessageData, UseMessageManagementProps } from '../Types/ChatTypes';
import { getMessages, createMessage, uploadMediaMessage } from '../Services/ChatService';
import usePersonalMessagesHub from './UsePersonalMessages';
import { encryptionService } from '../Services/EncryptionService';

const PAGE_LIMIT = 35;

export const useMessageManagement = ({
    personalConference,
    currentUserId,
    currentUser,
    encryptionSessionReady
}: UseMessageManagementProps, baseUrl: string, csrfToken: string | null) => {
    const [messages, setMessages] = useState<PersonalMessageData[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const [currentOffset, setCurrentOffset] = useState(0);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    const processedMessagesRef = useRef<Set<string>>(new Set());
    const shouldScrollToBottomRef = useRef(false);

    const decryptSingleMessage = useCallback(async (message: PersonalMessageData, forceDecryptOwn = false): Promise<PersonalMessageData> => {
        if (!message.isEncrypted || !message.encryptionMetadata || !message.messageContent) {
            return message;
        }

        const isOwnMessage = message.accountId === currentUserId;
        if (isOwnMessage && !forceDecryptOwn) {
            return message;
        }

        if (!message.encryptionMetadata) {
            return message;
        }

        try {
            const decrypted = await encryptionService.autoDecryptMessage(baseUrl, message, message.accountId, csrfToken);
            return {
                ...decrypted,
                encryptionMetadata: undefined,
                isEncrypted: false
            };
        } catch {
            return {
                ...message,
                messageContent: '[Не удалось расшифровать сообщение]',
                isEncrypted: false
            };
        }
    }, [currentUserId]);

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
        if (!personalConference || !currentUserId) return;

        try {
            setIsLoadingMessages(true);
            shouldScrollToBottomRef.current = true;
            const loadedMessages = await getMessages(baseUrl, personalConference, PAGE_LIMIT, 0);
            processedMessagesRef.current.clear();

            const decryptedMessages = await Promise.all(
                loadedMessages.map((message) =>
                    message.isEncrypted && message.encryptionMetadata
                        ? decryptSingleMessage(message, true)
                        : Promise.resolve(message)
                )
            );

            setMessages(decryptedMessages.reverse());
            setCurrentOffset(PAGE_LIMIT);
            setHasMoreMessages(loadedMessages.length === PAGE_LIMIT);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [personalConference, currentUserId, decryptSingleMessage]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const loadOlderMessages = useCallback(async (chatElement: HTMLDivElement) => {
        if (!personalConference || !currentUserId || isLoadingOlderMessages || !hasMoreMessages) return;

        try {
            setIsLoadingOlderMessages(true);

            const scrollTopBefore = chatElement.scrollTop;
            const scrollHeightBefore = chatElement.scrollHeight;

            const olderMessages = await getMessages(baseUrl, personalConference, PAGE_LIMIT, currentOffset);

            if (olderMessages.length === 0) {
                setHasMoreMessages(false);
                return;
            }

            const decryptedMessages = await Promise.all(
                olderMessages.map((message) =>
                    message.isEncrypted && message.encryptionMetadata
                        ? decryptSingleMessage(message, true)
                        : Promise.resolve(message)
                )
            );

            const reversedMessages = decryptedMessages.reverse();

            setMessages(prev => {
                const merged = [...reversedMessages, ...prev];

                const uniqueMessages = Array.from(
                    new Map(merged.map(m => [m.id, m])).values()
                );

                return uniqueMessages;
            });

            setCurrentOffset(prev => prev + PAGE_LIMIT);
            setHasMoreMessages(olderMessages.length === PAGE_LIMIT);

            requestAnimationFrame(() => {
                const scrollHeightAfter = chatElement.scrollHeight;
                const heightAdded = scrollHeightAfter - scrollHeightBefore;

                chatElement.style.scrollBehavior = 'auto';
                chatElement.scrollTop = scrollTopBefore + heightAdded;

                setTimeout(() => {
                    chatElement.style.scrollBehavior = 'smooth';
                }, 50);
            });
        } catch (error) {
            console.error('Failed to load older messages:', error);
        } finally {
            setIsLoadingOlderMessages(false);
        }
    }, [personalConference, currentUserId, currentOffset, isLoadingOlderMessages, hasMoreMessages, decryptSingleMessage]);

    const handleNewMessage = useCallback((message: PersonalMessageData) => {
        try {
            const messageId = message.id;

            if (processedMessagesRef.current.has(messageId)) {
                return;
            }
            processedMessagesRef.current.add(messageId);

            if (message.accountId === currentUserId) {
                updateMessage({ ...message, isEncrypted: false });
                return;
            }

            if (!message.isEncrypted || !message.encryptionMetadata) {
                updateMessage(message);
                return;
            }

            decryptSingleMessage(message).then(decryptedMessage => {
                updateMessage(decryptedMessage);
            }).catch(error => {
                console.error('Error decrypting real-time message:', error);
                processedMessagesRef.current.delete(message.id);
            });

        } catch (error) {
            console.error('Error processing new message:', error);
            processedMessagesRef.current.delete(message.id);
        }
    }, [currentUserId, decryptSingleMessage, updateMessage]);

    usePersonalMessagesHub(personalConference, handleNewMessage, baseUrl);

    const handleSend = useCallback(async (text: string, media?: {
        file: File;
        mediaUrl: string;
        mediaType: string;
        fileName: string;
    }) => {
        if (!currentUserId || !personalConference) return;

        const tempMessageId = crypto.randomUUID();
        const tempMessage: PersonalMessageData = {
            id: tempMessageId,
            messageContent: text,
            messageDateSent: new Date(),
            accountId: currentUserId,
            accountNickname: currentUser?.nickname || null,
            personalConferenceId: personalConference,
            groupConferenceId: null,
            sectorId: null,
            idEdited: false,
            previousMessageContent: null,
            isPinned: false,
            isRead: false,
            referenceMessageId: null,
            mediaUrl: media?.mediaUrl,
            mediaType: media?.mediaType,
            fileName: media?.fileName,
            isEncrypted: false,
            encryptionVersion: encryptionSessionReady ? 1 : undefined
        };

        setMessages(prev => [...prev, tempMessage]);
        shouldScrollToBottomRef.current = true;

        try {
            const messageData = {
                ...tempMessage,
                isEncrypted: encryptionSessionReady
            };

            if (media?.file) {
                setIsUploading(true);
                await uploadMediaMessage(tempMessageId, {
                    file: media.file,
                    messageContent: text,
                    accountId: currentUserId,
                    accountNickname: currentUser?.nickname || null,
                    personalConferenceId: personalConference,
                    isEncrypted: encryptionSessionReady
                }, baseUrl, csrfToken);
            } else {
                await createMessage(messageData, baseUrl, csrfToken);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempMessageId));
        } finally {
            setIsUploading(false);
        }
    }, [currentUserId, personalConference, currentUser, encryptionSessionReady]);

    return {
        messages,
        setMessages,
        isUploading,
        isLoadingMessages,
        isLoadingOlderMessages,
        loadMessages,
        loadOlderMessages,
        hasMoreMessages,
        handleSend,
        shouldScrollToBottomRef
    };
};