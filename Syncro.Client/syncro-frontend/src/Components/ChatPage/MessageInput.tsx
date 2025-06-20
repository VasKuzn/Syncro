import React, { useState } from "react";

interface Props {
  onSend: (message: string) => void;
}

const MessageInput: React.FC<Props> = ({ onSend }) => {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (value.trim()) {
      onSend(value);
      setValue("");
    }
  };

  return (
    <div className="message-input-container">
      <input
        className="message-input-field"
        placeholder="Написать"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
    </div>
  );
};

export default MessageInput;
