import React, { useState, useEffect } from 'react';
import MessageWithMemo from '../Components/ChatPage/MessageComponent';
import MessageInput from '../Components/ChatPage/MessageInput';
import MainComponent from '../Components/ChatPage/MainComponents';
import '../Styles/Chat.css';

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Invalid JWT token', e);
    return null;
  }
}

function getCookie(name: string) {
  let cookie = document.cookie.split('; ').find(row => row.startsWith(name + '='));
  return cookie ? cookie.split('=')[1] : null;
}

interface MessageData {
  id: number;
  name: string;
  time: string;
  message: string;
}

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const token = getCookie('token');
  const user = token ? parseJwt(token) : null;

  useEffect(() => {
    const saved = localStorage.getItem('chatMessages');
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);

  const handleSend = (message: string) => {
    const newMessage: MessageData = {
      id: Date.now(),
      name: user?.name || "user",
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

  return <MainComponent chatContent={chatContent} />;
};

export default ChatPage;
