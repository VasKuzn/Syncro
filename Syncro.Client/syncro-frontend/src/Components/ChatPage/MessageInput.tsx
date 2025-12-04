import { useState, useRef } from "react";
import { MessageInputProps } from "../../Types/ChatTypes";

const MessageInput = ({ onSend, isUploading }: MessageInputProps) => {
  const [value, setValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <div className="message-input-container">
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
        disabled={(!value.trim() && !selectedFile) || isUploading}
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