import { useState } from "react";
import { MessageInputProps } from "../../Types/ChatTypes";

const MessageInput = ({ onSend }: MessageInputProps) => {
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
        placeholder="Отправить"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
      />
    </div>
  );
};

export default MessageInput;
