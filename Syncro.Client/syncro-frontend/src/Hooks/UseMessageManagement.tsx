import { useState, useRef, useCallback, useEffect } from 'react';
import { PersonalMessageData, UseMessageManagementProps } from '../Types/ChatTypes';
import { getMessages, createMessage, uploadMediaMessage } from '../Services/ChatService';
import usePersonalMessagesHub from './UsePersonalMessages';
import { encryptionService } from '../Services/EncryptionService';

export const useMessageManagement = ({
    personalConference,
    currentUserId,
    currentUser,
    encryptionSessionReady
}: UseMessageManagementProps) => {
    const [messages, setMessages] = useState<PersonalMessageData[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

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
            const decrypted = await encryptionService.autoDecryptMessage(message, message.accountId);
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
            const loadedMessages = await getMessages(personalConference);
            processedMessagesRef.current.clear();

            const decryptedMessages = await Promise.all(
                loadedMessages.map((message) =>
                    message.isEncrypted && message.encryptionMetadata
                        ? decryptSingleMessage(message, true)
                        : Promise.resolve(message)
                )
            );

            setMessages(decryptedMessages);
        } catch (error) {
            console.error('Failed to load messages:', error);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [personalConference, currentUserId, decryptSingleMessage]);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

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

    usePersonalMessagesHub(personalConference, handleNewMessage);

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
                });
            } else {
                await createMessage(messageData);
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
        loadMessages,
        handleSend,
        shouldScrollToBottomRef
    };
};