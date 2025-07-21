import { useState, useEffect, useCallback, useRef } from 'react';
import { PersonalMessageData } from '../Types/ChatTypes';
import Message from '../Components/ChatPage/MessageComponent';
import MessageInput from '../Components/ChatPage/MessageInput';
import MainComponent from '../Components/ChatPage/MainComponents';
import '../Styles/Chat.css';
import { Friend } from '../Types/FriendType';
import { fetchCurrentUser } from '../Services/MainFormService';
import { useLocation } from 'react-router-dom';
import { createMessage, getMessages, uploadMediaMessage } from '../Services/ChatService';
import usePersonalMessagesHub from '../Hooks/UsePersonalMessages';

const ChatPage = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [personalConference, setPersonalConference] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalMessageData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const location = useLocation();
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
          <div className="messages">
            {messages.map((msg) => (
              <Message
                key={msg.id}
                {...msg}
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