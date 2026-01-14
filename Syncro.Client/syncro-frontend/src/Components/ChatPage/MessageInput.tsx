import { useState, useRef, useEffect } from "react";
import { MessageInputProps } from "../../Types/ChatTypes";
import attachIcon from '../../assets/clipicon.svg';
import sendIcon from '../../assets/send-message.svg';
import loadingIcon from '../../assets/loadingicon.svg';
import emojiIcon from '../../assets/emoji-icon.png';

const MessageInput = ({
  onSend,
  isUploading,
  disabled = false,
  value,
  onValueChange,
  onToggleEmojiPicker,
  showEmojiPicker
}: MessageInputProps & {
  value: string;
  onValueChange: (value: string) => void;
  onToggleEmojiPicker: () => void;
  showEmojiPicker: boolean;
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if ((value.trim() || selectedFile) && !disabled) {
      onSend(value, selectedFile ? {
        file: selectedFile,
        fileName: selectedFile.name,
        mediaType: selectedFile.type,
        mediaUrl: filePreview || ""
      } : undefined);
      onValueChange("");
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleSkClick = () => {
    if (!isUploading && !disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && !isUploading && !disabled) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }

      e.target.value = "";
    }
  };

  const removeFile = () => {
    if (!disabled) {
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      handleSend();
    }
  };

  return (
    <div className={`message-input-container ${disabled ? 'disabled' : ''}`}>
      {selectedFile && (
        <div className={`file-preview ${filePreview ? 'image-preview' : ''}`}>
          {filePreview ? (
            <>
              <img src={filePreview} alt="Preview" className="preview-image" />
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <button
                  onClick={removeFile}
                  className="remove-file-btn"
                  disabled={disabled}
                >
                  ×
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="file-name">{selectedFile.name}</span>
              <button
                onClick={removeFile}
                className="remove-file-btn"
                disabled={disabled}
              >
                ×
              </button>
            </>
          )}
        </div>
      )}

      <input
        className="message-input-field"
        placeholder="Type a message..."
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isUploading || disabled}
      />

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: "none" }}
        accept="image/*,video/*,audio/*"
        disabled={isUploading || disabled}
      />

      <button
        className="sk-class attach-button"
        onClick={handleSkClick}
        type="button"
        disabled={isUploading}
        title="Attach file"
      >
        {isUploading ? (
          <span className="upload-spinner"></span>
        ) : (
          <img src={attachIcon} alt="Attach media" />
        )}
      </button>

      <button
        className={`sk-class emoji-button ${showEmojiPicker ? 'active' : ''}`}
        onClick={onToggleEmojiPicker}
        type="button"
        disabled={isUploading}
        title="Add emoji"
      >
        <img src={emojiIcon} alt="Emoji" />
      </button>

      <button
        className="send-button"
        onClick={handleSend}
        disabled={(!value.trim() && !selectedFile) || isUploading || disabled}
      >
        {isUploading ? (
          <>
            <img className="loading-state-img" src={loadingIcon} alt="Sending" width="30" height="30" />
          </>
        ) : (
          <>
            <img className="send-state-img" src={sendIcon} alt="Send" width="30" height="30" />
          </>
        )}
      </button>
    </div>
  );
};

export default MessageInput;