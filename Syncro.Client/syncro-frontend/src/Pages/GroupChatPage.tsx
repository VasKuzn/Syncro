import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Message from '../Components/ChatPage/MessageComponent';
import MessageInput from '../Components/ChatPage/MessageInput';
import MainComponent from '../Components/ChatPage/MainComponents';
import EmojiPickerButton from '../Components/ChatPage/EmojiPickerButton';
import { useGroupChatInitialization } from '../Hooks/UseGroupChatInitialization';
import { useChatSearch } from '../Hooks/UseChatSearch';
import { useGroupMessageManagement } from '../Hooks/useGroupMessageManagement';
import '../Styles/Chat.css';
import '../Styles/GroupChat.css';
import searchIcon from '../assets/search3.png';
import arrowDownIcon from '../assets/arrow-down.png';
import backIcon from '../assets/arrow-back.png';

const GroupChatPage = () => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const navigate = useNavigate();

    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [messageInputValue, setMessageInputValue] = useState('');
    const [showScrollDownButton, setShowScrollDownButton] = useState(false);

    const {
        groupId,
        currentUserId,
        currentUser,
        group,
        participants,
        loading,
        error,
        getSenderInfo
    } = useGroupChatInitialization();
    const safeGroupId = groupId ?? null;

    const {
        messages,
        isUploading,
        isLoadingMessages,
        handleSend: sendMessage,
        shouldScrollToBottomRef
    } = useGroupMessageManagement({
        groupId: safeGroupId,
        currentUserId,
        currentUser
    });

    const search = useChatSearch(messages);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, []);

    const scrollToBottomInstant = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView();
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (!chatRef.current) return;
        const chat = chatRef.current;
        const isScrolledUp = chat.scrollHeight - chat.scrollTop - chat.clientHeight > 300;
        setShowScrollDownButton(isScrolledUp || search.isSearchActive);
    }, [search.isSearchActive]);

    useEffect(() => {
        if (shouldScrollToBottomRef.current && !isLoadingMessages && messages.length > 0) {
            const timer = setTimeout(() => {
                scrollToBottomInstant();
                shouldScrollToBottomRef.current = false;
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [messages, isLoadingMessages, scrollToBottomInstant, shouldScrollToBottomRef]);

    useEffect(() => {
        const chat = chatRef.current;
        if (chat) {
            chat.addEventListener('scroll', handleScroll);
            return () => chat.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest('.emoji-button')) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (search.currentResultIndex >= 0 && search.searchResults.length > 0) {
            search.scrollToResult(search.currentResultIndex, messageRefs.current);
        }
    }, [search.currentResultIndex, search.scrollToResult, search.searchResults]);

    const handleSend = useCallback(async (text: string, media?: {
        file: File;
        mediaUrl: string;
        mediaType: string;
        fileName: string;
    }) => {
        await sendMessage(text, media);
        setMessageInputValue('');
        setShowEmojiPicker(false);
    }, [sendMessage]);

    const handleEmojiSelect = useCallback((emoji: string) => {
        setMessageInputValue(prev => prev + emoji);
    }, []);

    // Мини-компонент для отображения аватарок участников в шапке
    const ParticipantsAvatars = () => {
        const displayParticipants = participants.slice(0, 5);
        const remainingCount = participants.length - 5;

        return (
            <div className="participants-avatars-row">
                {displayParticipants.map((user, index) => (
                    <div 
                        key={user.id} 
                        className="participant-mini-avatar"
                        style={{ zIndex: 10 - index }}
                        title={user.nickname}
                    >
                        <img src={user.avatar || "../logo.png"} alt={user.nickname} />
                        {user.isOnline && <span className="mini-online-dot" />}
                    </div>
                ))}
                {remainingCount > 0 && (
                    <div className="participants-count-badge">
                        +{remainingCount}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error || !group) return <div className="error">{error || 'Группа не найдена'}</div>;

    return (
        <MainComponent
            chatContent={
                <>
                    {/* Шапка как в обычном чате, но с информацией о группе */}
                    <AnimatePresence>
                        {!false && (
                            <motion.div
                                className="call-button-container"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                                <div className="group-info-header">
                                    <div
                                        className="group-profile-preview"
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img
                                            src={group.conferenceAvatar || "../logo.png"}
                                            alt={group.conferenceName}
                                            className="group-avatar-small"
                                        />
                                        <div className="group-info-text">
                                            <span className="group-name">{group.conferenceName}</span>
                                            <span className="participants-count-text">
                                                {participants.length} участников
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Аватарки участников в шапке */}
                                <ParticipantsAvatars />

                                <AnimatePresence>
                                    {search.isSearchActive && (
                                        <motion.div
                                            className="search-panel"
                                            initial={{ opacity: 0, width: 0, x: -20 }}
                                            animate={{ opacity: 1, width: "300px", x: 0 }}
                                            exit={{ opacity: 0, width: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div className="search-input-container">
                                                <img src={searchIcon} alt="Поиск" className="search-icon" />
                                                <input
                                                    type="text"
                                                    className="search-input"
                                                    placeholder="Поиск сообщений..."
                                                    value={search.searchQuery}
                                                    onChange={(e) => search.setSearchQuery(e.target.value)}
                                                    autoFocus
                                                />
                                                <button className="search-close-btn" onClick={search.handleExitSearch}>
                                                    ✕
                                                </button>
                                            </div>

                                            {search.searchQuery && (
                                                <div className="search-results-info">
                                                    <span>
                                                        {search.searchResults.length > 0
                                                            ? `Найдено: ${search.currentResultIndex + 1} из ${search.searchResults.length}`
                                                            : 'Совпадений не найдено'}
                                                    </span>
                                                    <div className="search-navigation">
                                                        <button
                                                            className="search-nav-btn"
                                                            onClick={search.goToPrevResult}
                                                            disabled={search.searchResults.length === 0}
                                                        >
                                                            ▲
                                                        </button>
                                                        <button
                                                            className="search-nav-btn"
                                                            onClick={search.goToNextResult}
                                                            disabled={search.searchResults.length === 0}
                                                        >
                                                            ▼
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!search.isSearchActive && (
                                    <motion.button
                                        className="search-button"
                                        onClick={() => search.setIsSearchActive(true)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <img src={searchIcon} alt="Поиск" width="16" height="16" />
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Кнопка скролла вниз */}
                    <AnimatePresence>
                        {showScrollDownButton && (
                            <motion.button
                                className="scroll-down-button"
                                onClick={scrollToBottom}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <img src={arrowDownIcon} alt="Вниз" width="20" height="20" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Сообщения */}
                    <motion.div
                        className="messages"
                        ref={chatRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        {isLoadingMessages && (
                            <div className="messages-decrypting-overlay">
                                <div className="messages-decrypting-spinner"></div>
                                <div className="messages-decrypting-text">Загрузка чата...</div>
                            </div>
                        )}

                        <AnimatePresence mode="popLayout">
                            {messages.map((msg, i) => {
                                const senderInfo = getSenderInfo(msg.accountId);
                                return (
                                    <motion.div
                                        key={msg.id}
                                        ref={(el) => {
                                            if (el) messageRefs.current.set(i, el);
                                            else messageRefs.current.delete(i);
                                        }}
                                        layout
                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                        className={`message-container ${search.searchResults.includes(i) ? 'search-result' : ''
                                            } ${i === search.searchResults[search.currentResultIndex] ? 'current-result' : ''}`}
                                    >
                                        <Message
                                            {...msg}
                                            isOwnMessage={msg.accountId === currentUserId}
                                            avatarUrl={senderInfo.avatar}
                                            previousMessageAuthor={i > 0 ? messages[i - 1].accountNickname : null}
                                            previousMessageDate={i > 0 ? messages[i - 1].messageDateSent : null}
                                            searchQuery={search.searchQuery}
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        <div ref={messagesEndRef} />
                    </motion.div>

                    {/* Поле ввода сообщения */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.3 }}
                    >
                        <MessageInput
                            onSend={handleSend}
                            isUploading={isUploading}
                            value={messageInputValue}
                            onValueChange={setMessageInputValue}
                            onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
                            showEmojiPicker={showEmojiPicker}
                        />
                        {showEmojiPicker && (
                            <motion.div
                                ref={emojiPickerRef}
                                className="emoji-picker-container"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />
                            </motion.div>
                        )}
                    </motion.div>
                </>
            }
            friends={[]} // В групповом чате список друзей не нужен
            nickname={currentUser?.nickname}
            avatar={currentUser?.avatar}
            isOnline={true}
            setFriends={() => {}}
        />
    );
};

export default GroupChatPage;