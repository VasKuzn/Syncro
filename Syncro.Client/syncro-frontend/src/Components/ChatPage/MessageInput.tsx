import { useState, useRef, useEffect } from "react";
import { MessageInputProps } from "../../Types/ChatTypes";
import attachIcon from '../../assets/clipicon.svg';
import sendIcon from '../../assets/send-message.svg';
import loadingIcon from '../../assets/loadingicon.svg';
import emojiIcon from '../../assets/emoji-icon.png';
import EmojiPickerButton from "./EmojiPickerButton";

const MessageInput = ({ onSend, isUploading }: MessageInputProps) => {
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if (value.trim() || selectedFile) {
      onSend(value, selectedFile ? {
        file: selectedFile,
        fileName: selectedFile.name,
        mediaType: selectedFile.type,
        mediaUrl: filePreview || ""
      } : undefined);
      setValue("");
      setSelectedFile(null);
      setFilePreview(null);
    }
  };

  const handleSkClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && !isUploading) {
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
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleEmojiSelect = (emoji: string) => {
    setValue(prev => prev + emoji);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as Element).closest('.emoji-button')) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="message-input-wrapper">
      {selectedFile && (
        <div className={`file-preview ${filePreview ? 'image-preview' : ''}`}>
          {filePreview ? (
            <>
              <img src={filePreview} alt="Preview" className="preview-image" />
              <div className="file-info">
                <span className="file-name">{selectedFile.name}</span>
                <button onClick={removeFile} className="remove-file-btn">×</button>
              </div>
            </>
          ) : (
            <>
              <span className="file-name">{selectedFile.name}</span>
              <button onClick={removeFile} className="remove-file-btn">×</button>
            </>
          )}
        </div>
      )}

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
          className="sk-class emoji-button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          type="button"
          disabled={isUploading}
          title="Add emoji"
        >
          <img src={emojiIcon} alt="Emoji" />
        </button>

        <button
          className="send-button"
          onClick={handleSend}
          disabled={(!value.trim() && !selectedFile) || isUploading}
          title="Send message"
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

      {showEmojiPicker && (
        <div ref={emojiPickerRef} className="emoji-picker-container">
          <EmojiPickerButton onEmojiSelect={handleEmojiSelect} />
        </div>
      )}
    </div>
  );
};

export default MessageInput;