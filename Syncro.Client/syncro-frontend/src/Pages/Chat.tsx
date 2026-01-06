import { useState, useEffect, useCallback, useRef } from 'react';
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
import { createMessage, getMessages, uploadMediaMessage, getPersonalConferenceById, initializeEncryptionWithFriend } from '../Services/ChatService';
import usePersonalMessagesHub from '../Hooks/UsePersonalMessages';
import UseRtcConnection from '../Hooks/UseRtcConnection';
import { AnimatePresence, motion } from 'framer-motion';
import callIcon from '../assets/callicon.svg';
import loadingIcon from '../assets/loadingicon.svg';
import { encryptionService } from '../Services/EncryptionService';

const ChatPage = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [personalConference, setPersonalConference] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalMessageData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement | null>(null);

  const [showCallModal, setShowCallModal] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callInitiator, setCallInitiator] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [currentFriend, setCurrentFriend] = useState<Friend | null>(null);
  const [currentUser, setCurrentUser] = useState<Friend | null>(null);
  const [encryptionSessionReady, setEncryptionSessionReady] = useState(false);

  const processedMessagesRef = useRef<Set<string>>(new Set());

  const rtcConnection = UseRtcConnection({
    onRemoteStream: (stream: MediaStream) => {
      console.log("Remote stream received");
      remoteStreamRef.current = stream;
    },
    onLocalStream: (stream: MediaStream) => {
      console.log("Local stream received");
      localStreamRef.current = stream;
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
      chat.scrollTop = chat.scrollHeight;
    });
  }, []);

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

  const isUserAtBottom = useCallback(() => {
    const pos = chatRef.current;
    if (!pos) return true;
    return pos.scrollHeight - pos.scrollTop - pos.clientHeight < 300;
  }, []);

  const decryptSingleMessage = useCallback(async (message: PersonalMessageData, forceDecryptOwn = false): Promise<PersonalMessageData> => {
    if (!message.isEncrypted || !message.encryptionMetadata || !message.messageContent) {
      return message;
    }

    const isOwnMessage = message.accountId === currentUserId;
    if (isOwnMessage && !forceDecryptOwn) {
      return message;
    }

    const senderId = message.accountId;
    if (!senderId) {
      return message;
    }

    if (!message.encryptionMetadata) {
      console.warn('Message missing encryption metadata, cannot decrypt:', message.id);
      return message;
    }

    if (message.messageContent.length < 4) {
      console.warn('Message appears too short to be encrypted:', message.id);
      return message;
    }

    try {
      const decrypted = await encryptionService.autoDecryptMessage(message, senderId);

      return {
        ...decrypted,
        encryptionMetadata: undefined,
        isEncrypted: false
      };
    } catch (error) {
      console.warn('Failed to decrypt message:', message.id, error);
      return {
        ...message,
        messageContent: '[Не удалось расшифровать сообщение]',
        isEncrypted: false
      };
    }
  }, [currentUserId]);

  const handleNewMessage = useCallback((message: PersonalMessageData) => {
    try {
      const messageId = message.id;

      if (processedMessagesRef.current.has(messageId)) {
        return;
      }
      processedMessagesRef.current.add(messageId);

      if (message.accountId === currentUserId) {
        updateMessage({ ...message, isEncrypted: false });
        if (isUserAtBottom()) {
          setTimeout(scrollToBottom, 50);
        }
        return;
      }

      if (!message.isEncrypted || !message.encryptionMetadata) {
        updateMessage(message);
        if (isUserAtBottom()) {
          setTimeout(scrollToBottom, 50);
        }
        return;
      }

      decryptSingleMessage(message).then(decryptedMessage => {
        updateMessage(decryptedMessage);
        if (isUserAtBottom()) {
          setTimeout(scrollToBottom, 50);
        }
      }).catch(error => {
        console.error('Error decrypting real-time message:', error);
        processedMessagesRef.current.delete(message.id);
      });

    } catch (error) {
      console.error('Error processing new message:', error);
      processedMessagesRef.current.delete(message.id);
    }
  }, [scrollToBottom, isUserAtBottom, decryptSingleMessage, currentUserId, updateMessage]);

  usePersonalMessagesHub(personalConference, handleNewMessage);

  useEffect(() => {
    const initializeEncryption = async () => {
      if (currentFriend?.id && currentUserId) {
        try {
          const success = await initializeEncryptionWithFriend(currentFriend.id, currentUserId);
          setEncryptionSessionReady(success);
        } catch (error) {
          console.error('Error initializing encryption with friend:', error);
          setEncryptionSessionReady(false);
        }
      }
    };

    if (currentFriend && currentUserId) {
      initializeEncryption();
    }
  }, [currentFriend, currentUserId]);

  useEffect(() => {
    const initializeUser = async () => {
      const userId = await fetchCurrentUser();
      if (!userId) return;

      setCurrentUserId(userId);
      encryptionService.setCurrentUserId(userId);

      try {
        const publicKey = await encryptionService.getPublicKey(userId);
        if (!publicKey) {
          console.log('Generating encryption keys for user:', userId);
          await encryptionService.generateKeys(userId);
        }
      } catch (error) {
        console.warn('Failed to initialize user encryption:', error);
      }
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
    if (!personalConference || !currentUserId) return;

    try {
      setIsLoadingMessages(true);

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
      scrollToBottomInstant();
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [personalConference, currentUserId, scrollToBottomInstant, decryptSingleMessage]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const fetchUserById = useCallback(async (userId: string) => {
    const res = await fetch(`http://localhost:5232/api/accounts/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user');
    return res.json();
  }, []);

  useEffect(() => {
    const fetchCurrentUserData = async () => {
      if (!currentUserId) return;
      try {
        const currentUserData = await fetchUserById(currentUserId);
        setCurrentUser(currentUserData);
      } catch (err) {
        console.error('Failed to load current user', err);
      }
    };
    fetchCurrentUserData();
  }, [currentUserId, fetchUserById]);

  useEffect(() => {
    const fetchConferenceAndFriend = async () => {
      if (!personalConference || !currentUserId) return;
      try {
        const conf = await getPersonalConferenceById(personalConference);
        const friendId = String(conf.user1).toLowerCase() === String(currentUserId).toLowerCase()
          ? conf.user2
          : conf.user1;
        const friendData = await fetchUserById(friendId);
        setCurrentFriend(friendData);
      } catch (err) {
        console.error('Failed to load conference or friend', err);
      }
    };
    fetchConferenceAndFriend();
  }, [personalConference, currentUserId, fetchUserById]);

  const handleStartCall = async () => {
    if (!currentFriend?.id || !rtcConnection.isConnected) return;

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
      await rtcConnection.getLocalStream();
      setShowCallModal(false);
      setInCall(true);
      setIncomingCall(false);
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
    scrollToBottomInstant();

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
                <motion.button
                  className="call-button"
                  onClick={handleStartCall}
                  disabled={!rtcConnection.isConnected || !currentFriend}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {rtcConnection.isConnected ? (
                    <>
                      <img className='call-state-img' src={callIcon} alt="Вызов" width="16" height="16" />Начать звонок
                    </>
                  ) : (
                    <>
                      <img className='loading-state-img' src={loadingIcon} alt="Подключение" width="16" height="16" /> Подключение...
                    </>
                  )}
                </motion.button>
              </motion.div>
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
                  localStream={localStreamRef.current}
                  remoteStream={remoteStreamRef.current}
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
                >
                  <Message
                    {...msg}
                    isOwnMessage={msg.accountId === currentUserId}
                    avatarUrl={msg.accountId === currentUserId ?
                      (currentUser?.avatar || './logo.png') :
                      (currentFriend?.avatar || './logo.png')}
                    previousMessageAuthor={i > 0 ? messages[i - 1].accountNickname : null}
                    previousMessageDate={i > 0 ? messages[i - 1].messageDateSent : null}
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