import { useState, useRef } from "react";
import { MessageInputProps } from "../../Types/ChatTypes";

const MessageInput = ({ onSend, onMediaUpload, isUploading }: MessageInputProps) => {
  const [value, setValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (value.trim()) {
      onSend(value);
      setValue("");
    }
  };

  const handleSkClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && !isUploading) {
      onMediaUpload(e.target.files[0]);
      e.target.value = "";
    }
  };

  return (
    <div className="message-input-container">
      <input
        className="message-input-field"
        placeholder="Type a message..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSend()}
        disabled={isUploading}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,video/*,audio/*"
        disabled={isUploading}
      />

      <button
        className="send-button"
        onClick={handleSend}
        disabled={!value.trim() || isUploading}
      >
        {isUploading ? "Sending..." : "Send"}
      </button>

      <button
        className="sk-class"
        onClick={handleSkClick}
        type="button"
        disabled={isUploading}
      >
        {isUploading ? (
          <span className="upload-spinner">Uploading...</span>
        ) : (
          <img src="/sk.png" alt="Attach media" />
        )}
      </button>
    </div>
  );
};

export default MessageInput;
