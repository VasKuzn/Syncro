import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PersonalMessageData } from '../Types/ChatTypes';
import Message from '../Components/ChatPage/MessageComponent';
import MessageInput from '../Components/ChatPage/MessageInput';
import MainComponent from '../Components/ChatPage/MainComponents';
import VideoCall from "../Components/ChatPage/VideoCallComponent";
import CallWindow from "../Components/ChatPage/CallWindowComponent";
import '../Styles/Chat.css';
import { Friend } from '../Types/FriendType';
import { fetchCurrentUser } from '../Services/MainFormService';
import { useLocation } from 'react-router-dom';
import { createMessage, getMessages, uploadMediaMessage, getPersonalConferenceById, getNicknameById } from '../Services/ChatService';
import usePersonalMessagesHub from '../Hooks/UsePersonalMessages';
import UseRtcConnection from '../Hooks/UseRtcConnection';
import { AnimatePresence, motion } from 'framer-motion';
import callIcon from '../assets/callicon.svg';
import loadingIcon from '../assets/loadingicon.svg';
import searchIcon from '../assets/search3.png';
import arrowDownIcon from '../assets/arrow-down.png';

const ChatPage = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [personalConference, setPersonalConference] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalMessageData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  // Состояния для поиска
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);

  // Состояния для звонков
  const [showCallModal, setShowCallModal] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callInitiator, setCallInitiator] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const [currentFriend, setCurrentFriend] = useState<Friend | null>(null);
  const [currentUser, setCurrentUser] = useState<Friend | null>(null);

  // Ref для элементов сообщений
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const rtcConnection = UseRtcConnection({
    onRemoteStream: (stream: MediaStream) => {
      console.log("Remote stream received");
      remoteStreamRef.current = new MediaStream(stream.getTracks());
      setRemoteStream(new MediaStream(stream.getTracks()));
    },
    onLocalStream: (stream: MediaStream) => {
      console.log("Local stream received");
      localStreamRef.current = stream;
      setLocalStream(stream);
    },
    onIceCandidateReceived: (candidate: RTCIceCandidate) => {
      console.log("ICE candidate received:", candidate);
    },
    onCallEnded: (senderId: string) => {
      console.log("Call ended by:", senderId);
      handleEndCall();
    },
    onIncomingCall: (senderId: string) => {
      console.log("Incoming call from:", senderId);
      setCallInitiator(senderId);
      setIncomingCall(true);
      setShowCallModal(true);
    }
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const scrollToBottomInstant = useCallback(() => {
    const chat = chatRef.current;
    if (!chat) return;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
      });
    });
  }, []);

  const isUserAtBottom = useCallback(() => {
    const pos = chatRef.current;
    if (!pos) return true;
    return pos.scrollHeight - pos.scrollTop - pos.clientHeight < 300;
  }, []);

  // Поиск сообщений
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

  // Переход к следующему результату поиска
  const goToNextResult = useCallback(() => {
    if (searchResults.length === 0) return;

    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);
    scrollToResult(nextIndex);
  }, [searchResults, currentResultIndex]);

  // Переход к предыдущему результату поиска
  const goToPrevResult = useCallback(() => {
    if (searchResults.length === 0) return;

    const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentResultIndex(prevIndex);
    scrollToResult(prevIndex);
  }, [searchResults, currentResultIndex]);

  // Прокрутка к результату поиска
  const scrollToResult = useCallback((resultIndex: number) => {
    if (resultIndex < 0 || resultIndex >= searchResults.length) return;

    const messageIndex = searchResults[resultIndex];
    const messageElement = messageRefs.current.get(messageIndex);

    if (messageElement) {
      messageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      // Визуальное выделение найденного сообщения
      messageElement.classList.add('highlighted');
      setTimeout(() => {
        messageElement.classList.remove('highlighted');
      }, 2000);
    }
  }, [searchResults]);

  // Обработка изменения поискового запроса
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  // Автопрокрутка к текущему результату поиска
  useEffect(() => {
    if (currentResultIndex >= 0 && searchResults.length > 0) {
      scrollToResult(currentResultIndex);
    }
  }, [currentResultIndex, scrollToResult]);

  // Обработчик прокрутки для кнопки быстрой прокрутки вниз
  const handleScroll = useCallback(() => {
    if (!chatRef.current) return;

    const chat = chatRef.current;
    const isScrolledUp = chat.scrollHeight - chat.scrollTop - chat.clientHeight > 300;

    // Показываем кнопку если:
    // 1. Пользователь прокрутил вверх более чем на 1 экран
    // 2. Активен поиск (чтобы можно было быстро вернуться к последним сообщениям)
    setShowScrollDownButton(isScrolledUp || isSearchActive);
  }, [isSearchActive]);

  // Инициализация пользователя и загрузка сообщений
  useEffect(() => {
    const initializeUser = async () => {
      const userId = await fetchCurrentUser();
      setCurrentUserId(userId);
    };

    initializeUser();

    if (location.state?.friends) {
      setFriends(location.state.friends);
    }
    if (location.state?.personalConferenceId) {
      setPersonalConference(location.state.personalConferenceId);
    }
  }, [location.state]);

  const loadMessages = useCallback(async () => {
    if (!personalConference) return;

    try {
      const loadedMessages = await getMessages(personalConference);
      setMessages(loadedMessages);
      scrollToBottomInstant();
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [personalConference]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Загрузка данных пользователя и друга
  useEffect(() => {
    const fetchCurrentUserData = async () => {
      if (!personalConference || !currentUserId) return;
      try {
        const res = await fetch(`http://localhost:5232/api/accounts/${currentUserId}`);
        const currentUserData = await res.json();
        setCurrentUser(currentUserData);
      } catch (err) {
        console.error("Failed to load current user", err);
      }
    };
    fetchCurrentUserData();
  }, [personalConference, currentUserId]);

  useEffect(() => {
    const fetchConferenceAndFriend = async () => {
      if (!personalConference || !currentUserId) return;
      try {
        const conf = await getPersonalConferenceById(personalConference);
        const friendId =
          String(conf.user1).toLowerCase() === String(currentUserId).toLowerCase()
            ? conf.user2
            : conf.user1;
        const res = await fetch(`http://localhost:5232/api/accounts/${friendId}`);
        const friendData = await res.json();
        setCurrentFriend(friendData);
      } catch (err) {
        console.error("Failed to load conference or friend", err);
      }
    };
    fetchConferenceAndFriend();
  }, [personalConference, currentUserId]);

  // Вешаем обработчик скролла
  useEffect(() => {
    const chat = chatRef.current;
    if (chat) {
      chat.addEventListener('scroll', handleScroll);
      return () => chat.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Обработчик нового сообщения
  const handleNewMessage = useCallback((message: PersonalMessageData) => {
    setMessages(prev => {
      if (!prev.some(m => m.id === message.id)) {
        return [...prev, message];
      }
      return prev;
    });

    if (isUserAtBottom() && !isSearchActive) {
      setTimeout(scrollToBottom, 100);
    }
  }, [scrollToBottom, isUserAtBottom, isSearchActive]);

  usePersonalMessagesHub(personalConference, handleNewMessage);

  // Функции для звонков
  const handleStartCall = async () => {
    if (!currentFriend?.id || !rtcConnection.isConnected) {
      console.error("Cannot start call: friend not loaded or connection not ready");
      return;
    }

    try {
      await rtcConnection.getLocalStream();
      await rtcConnection.createOffer(currentFriend.id);

      setInCall(true);
      setShowCallModal(false);
      setIncomingCall(false);
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  };

  const handleAcceptCall = async () => {
    try {
      console.log("Accepting call from:", callInitiator);

      await rtcConnection.getLocalStream();
      setShowCallModal(false);
      setInCall(true);
      setIncomingCall(false);

      console.log("Call accepted successfully");
    } catch (error) {
      console.error("Failed to accept call:", error);
    }
  };

  const handleRejectCall = () => {
    if (callInitiator) {
      rtcConnection.endCall(callInitiator);
    }
    setShowCallModal(false);
    setIncomingCall(false);
    setCallInitiator(null);
  };

  const handleEndCall = () => {
    if (currentFriend?.id) {
      rtcConnection.endCall(currentFriend.id);
    }

    setInCall(false);
    setShowCallModal(false);
    setIncomingCall(false);
    setCallInitiator(null);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    remoteStreamRef.current = null;
  };

  const handleSend = async (text: string, media?: {
    file: File;
    mediaUrl: string;
    mediaType: string;
    fileName: string;
  }) => {
    if (!currentUserId || !personalConference) return;

    const newMessage: PersonalMessageData = {
      id: crypto.randomUUID(),
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
      fileName: media?.fileName
    };

    try {
      if (media && media.file) {
        setIsUploading(true);
        await uploadMediaMessage(newMessage.id, {
          file: media.file,
          messageContent: text,
          accountId: currentUserId,
          accountNickname: currentUser?.nickname || null,
          personalConferenceId: personalConference
        });
      } else {
        await createMessage(newMessage);
      }
      if (!isSearchActive) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Выход из режима поиска
  const handleExitSearch = () => {
    setIsSearchActive(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentResultIndex(-1);
  };

  return (
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
                {/* Панель поиска - теперь внутри chat-header-controls */}
                <AnimatePresence>
                  {isSearchActive && (
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
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          autoFocus
                        />
                        <button className="search-close-btn" onClick={handleExitSearch}>
                          ✕
                        </button>
                      </div>

                      {searchQuery && (
                        <div className="search-results-info">
                          <span>
                            {searchResults.length > 0
                              ? `Найдено: ${currentResultIndex + 1} из ${searchResults.length}`
                              : 'Совпадений не найдено'}
                          </span>
                          <div className="search-navigation">
                            <button
                              className="search-nav-btn"
                              onClick={goToPrevResult}
                              disabled={searchResults.length === 0}
                            >
                              ▲
                            </button>
                            <button
                              className="search-nav-btn"
                              onClick={goToNextResult}
                              disabled={searchResults.length === 0}
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Кнопка поиска - слева от панели */}
                {!isSearchActive && (
                  <motion.button
                    className="search-button"
                    onClick={() => setIsSearchActive(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img src={searchIcon} alt="Поиск" width="16" height="16" />
                  </motion.button>
                )}

                {/* Кнопка звонка */}
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

          {/* Кнопка быстрой прокрутки вниз */}
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
                  className={`message-container ${searchResults.includes(i) ? 'search-result' : ''
                    } ${i === searchResults[currentResultIndex] ? 'current-result' : ''
                    }`}
                >
                  <Message
                    {...msg}
                    isOwnMessage={msg.accountId === currentUserId}
                    avatarUrl={msg.accountId === currentUserId ?
                      (currentUser?.avatar || './logo.png') :
                      (currentFriend?.avatar || './logo.png')}
                    previousMessageAuthor={i > 0 ? messages[i - 1].accountNickname : null}
                    previousMessageDate={i > 0 ? messages[i - 1].messageDateSent : null}
                    searchQuery={searchQuery}
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
            />
          </motion.div>
        </>
      }
      friends={friends}
    />
  );
};

export default ChatPage;