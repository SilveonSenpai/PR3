import { useEffect, useRef, useState } from 'react';

interface Props {
  onSend: (text: string, file: File | null) => void;
  onTyping: () => void;
}

export default function MessageInput({ onSend, onTyping }: Props) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    onSend(text, file);
    setText('');
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    onTyping();
  };

  return (
    <div className="p-4 bg-white flex gap-2 border-t">
      <input
        type="text"
        value={text}
        onChange={handleInput}
        placeholder="Ваше повідомлення..."
        className="flex-1 border rounded p-2"
      />
      <input type="file" ref={fileRef} onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleSend} className="bg-blue-500 text-white px-4 py-2 rounded">
        Надіслати
      </button>
    </div>
  );
}
