import { useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { messageHub } from '../Hubs/MessageHub';
import callIcon from '../assets/callicon.svg';
import loadingIcon from '../assets/loadingicon.svg';
import searchIcon from '../assets/search3.png';
import arrowDownIcon from '../assets/arrow-down.png';
import { useCsrf } from '../Contexts/CsrfProvider';
import { VideoQuality } from '../Hooks/UseRtcConnection';
import { AudioFilters } from '../Types/ChatTypes';

const ChatPage = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const { baseUrl, csrfToken } = useCsrf();

  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messageInputValue, setMessageInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingFriendNickname, setTypingFriendNickname] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentUserNicknameRef = useRef<string | null>(null);

  const {
    friends,
    setFriends,
    personalConference,
    currentUserId,
    currentFriend,
    currentUser,
    encryptionSessionReady,
    setEncryptionSessionReady
  } = useChatInitialization(baseUrl, csrfToken);

  useEffect(() => {
    currentUserNicknameRef.current = currentUser?.nickname || null;
  }, [currentUser?.nickname]);

  useEffect(() => {
    const initHub = async () => {
      try {
        const conn = await messageHub.init();
        if (personalConference && conn) {
          setTimeout(() => {
            messageHub.subscribeToConference(personalConference);
          }, 100);
        }
      } catch (error) {
        console.error('Failed to initialize messageHub:', error);
      }
    };

    if (personalConference) {
      initHub();
    }
  }, [personalConference]);

  useEffect(() => {
    const handleUserTyping = (nickname: string) => {
      if (nickname !== currentUserNicknameRef.current) {
        setTypingFriendNickname(nickname);
        setIsTyping(true);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTypingFriendNickname(null);
        }, 5000);
      }
    };

    const handleUserStoppedTyping = () => {
      setIsTyping(false);
      setTypingFriendNickname(null);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };

    messageHub.onUserTyping(handleUserTyping);
    messageHub.onUserStoppedTyping(handleUserStoppedTyping);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleInputTyping = useCallback(async () => {
    if (!personalConference || !currentUser?.nickname) return;
    try {
      await messageHub.sendTyping(personalConference, currentUser.nickname);
    } catch (error) {
      console.error('Failed to send typing notification:', error);
    }
  }, [personalConference, currentUser?.nickname]);

  const handleInputStopTyping = useCallback(async () => {
    if (!personalConference) return;
    try {
      await messageHub.stopTyping(personalConference);
    } catch (error) {
      console.error('Failed to send stop typing notification:', error);
    }
  }, [personalConference]);

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

  const {
    messages,
    isUploading,
    isLoadingMessages,
    isLoadingOlderMessages,
    loadOlderMessages,
    handleSend: sendMessage,
    shouldScrollToBottomRef
  } = useMessageManagement({
    personalConference,
    currentUserId,
    currentUser,
    encryptionSessionReady
  }, baseUrl, csrfToken);

  const search = useChatSearch(messages);

  const {
    showCallModal,
    inCall,
    incomingCall,
    callInitiator,
    remoteStream,
    localStream,
    rtcConnection,
    currentRoomId,
    isWaitingForRemote,
    handleStartCall,
    handleAcceptCall,
    handleRejectCall,
    handleEndCall,
    microphoneVolume,
    audioFilters,
    handleVolumeChange,
    handleAudioFiltersChange,
    handleQualityChange,
    currentVideoQuality
  } = useCallManagement({
    currentFriend,
    currentUserId
  }, baseUrl);

  const [showScrollDownButton, setShowScrollDownButton] = useState(false);

  const handleScroll = useCallback(() => {
    if (!chatRef.current) return;

    const chat = chatRef.current;
    const isScrolledUp = chat.scrollHeight - chat.scrollTop - chat.clientHeight > 300;
    setShowScrollDownButton(isScrolledUp || search.isSearchActive);

    const scrollThreshold = 200;
    if (chat.scrollTop < scrollThreshold && !isLoadingOlderMessages) {
      loadOlderMessages(chat);
    }
  }, [search.isSearchActive, isLoadingOlderMessages, loadOlderMessages]);

  useEffect(() => {
    if (shouldScrollToBottomRef.current && !isLoadingMessages && !isLoadingOlderMessages && messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottomInstant();
        shouldScrollToBottomRef.current = false;
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [messages, isLoadingMessages, isLoadingOlderMessages, scrollToBottomInstant, shouldScrollToBottomRef]);

  useEffect(() => {
    const chat = chatRef.current;
    if (chat) {
      const isAtBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 100;
      if (isAtBottom && !search.isSearchActive && !isLoadingOlderMessages) {
        const timer = setTimeout(() => {
          scrollToBottom();
        }, 100);

        return () => clearTimeout(timer);
      }
    }
  }, [messages, search.isSearchActive, scrollToBottom, isLoadingOlderMessages]);

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
    (window as any).onMicrophoneVolumeChange = (volume: number) => {
      rtcConnection.setMicrophoneVolume(volume);
    };

    (window as any).onVideoQualityChange = (quality: VideoQuality) => {
      rtcConnection.setVideoQuality(quality);
    };

    (window as any).onAudioFiltersChange = (filters: AudioFilters) => {
      rtcConnection.applyAudioFilters(filters, microphoneVolume);
    };

    return () => {
      delete (window as any).onMicrophoneVolumeChange;
      delete (window as any).onVideoQualityChange;
      delete (window as any).onAudioFiltersChange;
    };
  }, [rtcConnection, microphoneVolume]);

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
    setMessageInputValue('');
    setShowEmojiPicker(false);
    await sendMessage(text, media);
  }, [sendMessage]);

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
                      </>
                    ) : (
                      <>
                        <img className='loading-state-img' src={loadingIcon} alt="Подключение" width="16" height="16" />
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
                    roomId={currentRoomId || ''}
                    signalRConnection={rtcConnection.videoChatHubConnection}
                    currentUserId={currentUserId || ''}
                    isWaitingForRemote={isWaitingForRemote}
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

              {isLoadingOlderMessages && (
                <div className="messages-loading-older">
                  <div className="messages-decrypting-spinner"></div>
                  <div className="messages-decrypting-text">Загрузка истории...</div>
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
              <AnimatePresence>
                {isTyping && typingFriendNickname && (
                  <motion.div
                    className="typing-indicator"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="typing-nickname">{typingFriendNickname}</span>
                    <span className="typing-text"> typing</span>
                    <span className="typing-dots">
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              <MessageInput
                onSend={handleSend}
                isUploading={isUploading}
                value={messageInputValue}
                onValueChange={setMessageInputValue}
                onToggleEmojiPicker={() => setShowEmojiPicker(!showEmojiPicker)}
                showEmojiPicker={showEmojiPicker}
                onTyping={handleInputTyping}
                onStopTyping={handleInputStopTyping}
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
        baseUrl={baseUrl}
        csrfToken={csrfToken}
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