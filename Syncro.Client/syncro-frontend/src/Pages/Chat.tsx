import { useState, useEffect, useCallback, useRef } from 'react';
import { PersonalMessageData } from '../Types/ChatTypes';
import Message from '../Components/ChatPage/MessageComponent';
import MessageInput from '../Components/ChatPage/MessageInput';
import MainComponent from '../Components/ChatPage/MainComponents';
import '../Styles/Chat.css';
import { Friend } from '../Types/FriendType';
import { fetchCurrentUser } from '../Services/MainFormService';
import { useLocation } from 'react-router-dom';
import { createMessage, getMessages } from '../Services/ChatService';
import usePersonalMessagesHub from '../Hooks/UsePersonalMessages';

const ChatPage = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentFriend, setCurrentFriend] = useState<Friend>();
  const [personalConference, setPersonalConference] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalMessageData[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const location = useLocation();

  const handleNewMessage = useCallback((message: PersonalMessageData) => {
    setMessages(prev => {
      if (!prev.some(m => m.id === message.id)) {
        return [...prev, message];
      }
      return prev;
    });
    setTimeout(scrollToBottom, 100);
  }, []);

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
    if (location.state?.friendId) {
      setCurrentFriend(location.state.friendId);
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
  }, [personalConference]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleSend = async (message: string) => {
    if (!currentUserId || !personalConference) return;

    const newMessage: PersonalMessageData = {
      id: crypto.randomUUID(),
      messageContent: message,
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
    };

    try {
      await createMessage(newMessage);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          <MessageInput onSend={handleSend} />
        </>
      }
      friends={friends}
    />
  );
};

export default ChatPage;