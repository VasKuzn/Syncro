import { useState, useEffect } from 'react';
import { MessageData } from '../Types/ChatTypes'
import MessageWithMemo from '../Components/ChatPage/MessageComponent';
import MessageInput from '../Components/ChatPage/MessageInput';
import MainComponent from '../Components/ChatPage/MainComponents';
import '../Styles/Chat.css';
import { Friend } from '../Types/FriendType';
import { fetchCurrentUser } from '../Services/MainFormService';
import { useLocation } from 'react-router-dom';

const ChatPage = () => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const location = useLocation();


  useEffect(() => {
    if (location.state?.friends) {
      setFriends(location.state.friends);
    }
  }, [location.state]);

  const handleSend = async (message: string) => {
    const newMessage: MessageData = {
      id: Date.now(),
      name: await fetchCurrentUser(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      message,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const chatContent = (
    <>
      <div className="messages">
        {messages.map((msg) => (
          <MessageWithMemo
            key={msg.id}
            id={msg.id}
            name={msg.name}
            time={msg.time}
            message={msg.message}
          />
        ))}
      </div>
      <MessageInput onSend={handleSend} />
    </>
  );

  return <MainComponent chatContent={chatContent} friends={friends} />;
};

export default ChatPage;
