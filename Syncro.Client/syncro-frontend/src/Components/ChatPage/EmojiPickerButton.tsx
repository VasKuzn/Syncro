import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EmojiPickerButtonProps {
    onEmojiSelect: (emoji: string) => void;
}

const EmojiPickerButton = ({ onEmojiSelect }: EmojiPickerButtonProps) => {

    return (
        <Picker
            data={data}
            theme="dark"
            onEmojiSelect={(emoji: any) => {
                if (!emoji?.native) return;
                // Передаем строку эмодзи в родительский компонент
                onEmojiSelect(emoji.native);
            }}
            showPreview={true}
            showSkinTones={true}
            searchPosition="sticky"
            previewPosition="bottom"
        />
    );
};

export default EmojiPickerButton;