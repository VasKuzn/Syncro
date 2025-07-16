import { useState, useEffect } from 'react';
import { PersonalMessageData } from '../Types/ChatTypes';
import Message from '../Components/ChatPage/MessageComponent';
import MessageInput from '../Components/ChatPage/MessageInput';
import MainComponent from '../Components/ChatPage/MainComponents';
import '../Styles/Chat.css';
import { Friend } from '../Types/FriendType';
import { fetchCurrentUser } from '../Services/MainFormService';
import { useLocation } from 'react-router-dom';
import { createMessage, getMessages } from '../Services/ChatService';

const ChatPage = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [currentFriend, setCurrentFriend] = useState<Friend>();
  const [personalConference, setPersonalConference] = useState<string | null>(null);
  const [messages, setMessages] = useState<PersonalMessageData[]>([]);
  const location = useLocation();

  useEffect(() => {
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

  useEffect(() => {
    if (personalConference) {
      loadMessages();
    }
  }, [personalConference]);

  const loadMessages = async () => {
    const loadedMessages = await getMessages(personalConference!);
    setMessages(loadedMessages);
  };

  const handleSend = async (message: string) => {
    const newMessage: PersonalMessageData = {
      id: crypto.randomUUID(),
      messageContent: message,
      messageDateSent: new Date(),
      accountId: await fetchCurrentUser(),
      personalConferenceId: personalConference,
      groupConferenceId: null,
      sectorId: null,
      idEdited: false,
      previousMessageContent: null,
      isPinned: false,
      isRead: false,
      referenceMessageId: null,
    };
    await createMessage(newMessage);
    setMessages(prev => [...prev, newMessage]);
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
          </div>
          <MessageInput onSend={handleSend} />
        </>
      }
      friends={friends}
    />
  );
};

export default ChatPage;