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
import { createMessage, getMessages, uploadMediaMessage, getPersonalConferenceById, getNicknameById } from '../Services/ChatService';
import usePersonalMessagesHub from '../Hooks/UsePersonalMessages';
import UseRtcConnection from '../Hooks/UseRtcConnection';

const ChatPage = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [personalConference, setPersonalConference] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalMessageData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [showCallModal, setShowCallModal] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(false);
  const [callInitiator, setCallInitiator] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [currentFriend, setCurrentFriend] = useState<Friend | null>(null);
  const [currentUser, setCurrentUser] = useState<Friend | null>(null);

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

  const handleNewMessage = useCallback((message: PersonalMessageData) => {
    setMessages(prev => {
      if (!prev.some(m => m.id === message.id)) {
        return [...prev, message];
      }
      return prev;
    });
    setTimeout(scrollToBottom, 100);
  }, [scrollToBottom]);

  usePersonalMessagesHub(personalConference, handleNewMessage);

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
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }, [personalConference, scrollToBottom]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

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
    mediaUrl: string;
    mediaType: string;
    fileName: string;
    file?: File;
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
          personalConferenceId: personalConference
        });
      } else {
        await createMessage(newMessage);
      }
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaUpload = async (file: File) => {
    if (!currentUserId || !personalConference) return;

    try {
      setIsUploading(true);
      const messageId = crypto.randomUUID();

      const response = await uploadMediaMessage(messageId, {
        file,
        messageContent: '',
        accountId: currentUserId,
        personalConferenceId: personalConference
      });

      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to upload media:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <MainComponent
      chatContent={
        <>
          {!inCall && (
            <div className="call-button-container">
              <button
                className="call-button"
                onClick={handleStartCall}
                disabled={!rtcConnection.isConnected || !currentFriend}
              >
                {rtcConnection.isConnected ? "📞 Вызов" : "⏳ Подключение..."}
              </button>
            </div>
          )}

          {showCallModal && incomingCall && (
            <CallWindow
              isIncoming={true}
              userName={currentFriend?.nickname || 'Друг'}
              avatarUrl={currentFriend?.avatar || './logo.png'}
              onAccept={handleAcceptCall}
              onReject={handleRejectCall}
            />
          )}

          {inCall && currentFriend && currentUser && (
            <VideoCall
              remoteUserName={currentFriend.nickname}
              remoteAvatarUrl={currentFriend.avatar || './logo.png'}
              localUserName={currentUser.nickname}
              localAvatarUrl={currentUser.avatar || './logo.png'}
              onEndCall={handleEndCall}
              localStream={localStreamRef.current}
              remoteStream={remoteStreamRef.current}
            />
          )}

          <div className="messages">
            {messages.map((msg) => (
              <Message
                key={msg.id}
                {...msg}
                isOwnMessage={msg.accountId === currentUserId}
                avatarUrl={msg.accountId === currentUserId ?
                  (currentUser?.avatar || './logo.png') :
                  (currentFriend?.avatar || './logo.png')}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <MessageInput
            onSend={handleSend}
            onMediaUpload={handleMediaUpload}
            isUploading={isUploading}
          />
        </>
      }
      friends={friends}
    />
  );
};

export default ChatPage;