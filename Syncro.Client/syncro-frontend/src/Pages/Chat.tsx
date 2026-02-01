import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Message from '../Components/ChatPage/MessageComponent';
import MessageInput from '../Components/ChatPage/MessageInput';
import MainComponent from '../Components/ChatPage/MainComponents';
import VideoCall from "../Components/ChatPage/VideoCallComponent";
import CallWindow from "../Components/ChatPage/CallWindowComponent";
import EmojiPickerButton from '../Components/ChatPage/EmojiPickerButton';
import { FriendProfileChat } from '../Components/ChatPage/FriendProfileChat';
import '../Styles/Chat.css';
import { useChatInitialization } from '../Hooks/UseChatInitialization';
import { useCallManagement } from '../Hooks/UseCallMenagement';
import { useMessageManagement } from '../Hooks/UseMessageManagement';
import { useChatSearch } from '../Hooks/UseChatSearch';
import callIcon from '../assets/callicon.svg';
import loadingIcon from '../assets/loadingicon.svg';
import searchIcon from '../assets/search3.png';
import arrowDownIcon from '../assets/arrow-down.png';

const ChatPage = () => {
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageInputValue, setMessageInputValue] = useState('');

  const {
    friends,
    setFriends,
    personalConference,
    currentUserId,
    currentFriend,
    currentUser,
    encryptionSessionReady,
    setEncryptionSessionReady
  } = useChatInitialization();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    const chat = chatRef.current;
    if (!chat) return;
    requestAnimationFrame(() => {
      chat.scrollTop = chat.scrollHeight;
    });
  }, []);

  const isUserAtBottom = useCallback(() => {
    const pos = chatRef.current;
    if (!pos) return true;
    return pos.scrollHeight - pos.scrollTop - pos.clientHeight < 300;
  }, []);

  const {
    messages,
    isUploading,
    isLoadingMessages,
    handleSend: sendMessage
  } = useMessageManagement({
    personalConference,
    currentUserId,
    currentUser,
    encryptionSessionReady,
    scrollToBottomInstant,
    scrollToBottom,
    isUserAtBottom
  });

  const search = useChatSearch(messages);

  const {
    showCallModal,
    inCall,
    incomingCall,
    callInitiator,
    remoteStream,
    localStream,
    rtcConnection,
    handleStartCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall
  } = useCallManagement({
    currentFriend,
    currentUserId
  });

  const [showScrollDownButton, setShowScrollDownButton] = useState(false);

  const handleScroll = useCallback(() => {
    if (!chatRef.current) return;

    const chat = chatRef.current;
    const isScrolledUp = chat.scrollHeight - chat.scrollTop - chat.clientHeight > 300;
    setShowScrollDownButton(isScrolledUp || search.isSearchActive);
  }, [search.isSearchActive]);

  useEffect(() => {
    const chat = chatRef.current;
    if (chat) {
      chat.addEventListener('scroll', handleScroll);
      return () => chat.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    setMessageInputValue(prev => prev + emoji);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
    if (!search.isSearchActive) {
      setTimeout(scrollToBottom, 100);
    }
  }, [sendMessage, search.isSearchActive, scrollToBottom]);

  const handleAvatarClick = useCallback((accountId: string) => {
    if (accountId !== currentUserId) {
      setShowFriendProfile(true);
    }
  }, [currentUserId]);

  return (
    <>
      <MainComponent
        chatContent={
          <>
            <AnimatePresence>
              {!inCall && (
                <motion.div
                  className="call-button-container"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <div className="friend-info-header">
                    {currentFriend && (
                      <div
                        className="friend-profile-preview"
                        onClick={() => setShowFriendProfile(true)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img
                          src={currentFriend?.avatar || "./logo.png"}
                          alt={currentFriend?.nickname}
                          className="friend-avatar-small"
                        />
                        <span className="friend-nickname">{currentFriend?.nickname}</span>
                      </div>
                    )}
                  </div>

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

                  <motion.button
                    className="call-button"
                    onClick={handleStartCall}
                    disabled={!rtcConnection.isConnected || !currentFriend}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {rtcConnection.isConnected ? (
                      <>
                        <img className='call-state-img' src={callIcon} alt="Вызов" width="16" height="16" />
                        Начать звонок
                      </>
                    ) : (
                      <>
                        <img className='loading-state-img' src={loadingIcon} alt="Подключение" width="16" height="16" />
                        Подключение...
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

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

            <AnimatePresence>
              {showCallModal && incomingCall && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <CallWindow
                    isIncoming={true}
                    userName={currentFriend?.nickname || 'Друг'}
                    avatarUrl={currentFriend?.avatar || './logo.png'}
                    onAccept={handleAcceptCall}
                    onReject={handleRejectCall}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {inCall && currentFriend && currentUser && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <VideoCall
                    remoteUserName={currentFriend.nickname}
                    remoteAvatarUrl={currentFriend.avatar || './logo.png'}
                    localUserName={currentUser.nickname}
                    localAvatarUrl={currentUser.avatar || './logo.png'}
                    onEndCall={handleEndCall}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    replaceVideoTrack={rtcConnection.replaceVideoTrack}
                  />
                </motion.div>
              )}
            </AnimatePresence>

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
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    ref={(el) => {
                      if (el) {
                        messageRefs.current.set(i, el);
                      } else {
                        messageRefs.current.delete(i);
                      }
                    }}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      opacity: { duration: 0.2 }
                    }}
                    className={`message-container ${search.searchResults.includes(i) ? 'search-result' : ''
                      } ${i === search.searchResults[search.currentResultIndex] ? 'current-result' : ''}`}
                  >
                    <Message
                      {...msg}
                      isOwnMessage={msg.accountId === currentUserId}
                      avatarUrl={msg.accountId === currentUserId ?
                        (currentUser?.avatar || './logo.png') :
                        (currentFriend?.avatar || './logo.png')}
                      previousMessageAuthor={i > 0 ? messages[i - 1].accountNickname : null}
                      previousMessageDate={i > 0 ? messages[i - 1].messageDateSent : null}
                      searchQuery={search.searchQuery}
                      onAvatarClick={() => {
                        // Если это сообщение друга, открываем его профиль
                        if (msg.accountId !== currentUserId) {
                          setShowFriendProfile(true);
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </motion.div>

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
        friends={friends}
        nickname={currentUser?.nickname}
        avatar={currentUser?.avatar}
        isOnline={true}
        setFriends={setFriends}
      />

      <FriendProfileChat
        friend={currentFriend}
        isOpen={showFriendProfile}
        onClose={() => setShowFriendProfile(false)}
      />
    </>
  );
};

export default ChatPage;