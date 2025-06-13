import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useChatHistory, ChatType, Message } from '../hooks/useChatHistory';

interface Props {
  socket: Socket;
  userId: string;
  chatType: ChatType;
  selectedId?: string;
  selectedName: string;
}

interface UserMap {
  [userId: string]: string;
}

export default function ChatPage({ socket, userId, chatType, selectedId, selectedName }: Props) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [usernames, setUsernames] = useState<UserMap>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { messages, reload } = useChatHistory(chatType, selectedId, userId);
  const [liveMessages, setLiveMessages] = useState<Message[]>([]);

  // Завантажуємо імена користувачів
  useEffect(() => {
    const allMessages = [...messages, ...liveMessages];
    const uniqueUserIds = [...new Set(allMessages.map(msg => msg.userId))];
    const missingIds = uniqueUserIds.filter(id => !(id in usernames));

    if (missingIds.length === 0) return;

    Promise.all(
      missingIds.map(id =>
        fetch(`/api/users/${id}`)
          .then(res => res.json())
          .then(data => ({ id, name: data.username || `User ${id}` }))
          .catch(() => ({ id, name: `User ${id}` }))
      )
    ).then(results => {
      const newMap: UserMap = {};
      results.forEach(r => {
        newMap[r.id] = r.name;
      });
      setUsernames(prev => ({ ...prev, ...newMap }));
    });
  }, [messages, liveMessages]);

  useEffect(() => {
    setLiveMessages([]); // очищаємо live-повідомлення при зміні чату

    // Приєднуємося до відповідних кімнат
    if (chatType === 'room' && selectedId) {
      socket.emit('joinRoom', { roomId: selectedId, userId });
    } else if (chatType === 'channel' && selectedId) {
      socket.emit('joinChannel', { channelId: selectedId, userId });
    } else if (chatType === 'global') {
      // Глобальний чат вже підключений за замовчуванням
    }

    const handleReceiveMessage = (msg: Message) => {
      console.log('Отримано повідомлення:', msg); // Для дебагу
      
      const relevant =
        (msg.chatType === 'global' && chatType === 'global') ||
        (msg.roomId === selectedId && chatType === 'room') ||
        (msg.channelId === selectedId && chatType === 'channel') ||
        (chatType === 'private' && 
          ((msg.userId === userId && msg.recipientId === selectedId) ||
           (msg.userId === selectedId && msg.recipientId === userId)));

      if (relevant) {
        setLiveMessages(prev => {
          const exists = prev.some(m => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [chatType, selectedId, socket, userId]);

  const handleSend = async () => {
    if (!text.trim() && !file) return;

    // ✔️ ВИПРАВЛЕНО: Додано перевірку, що для неглобальних чатів є ID
    if (chatType !== 'global' && !selectedId) {
      console.error(`Неможливо надіслати повідомлення: ID для чату типу "${chatType}" не встановлено.`);
      alert(`Помилка: чат не вибрано.`); // Повідомлення для користувача
      return;
    }

    let fileUrl = '';
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/files', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Помилка завантаження файлу');
        fileUrl = data.url;
      } catch (error) {
        console.error('Помилка завантаження файлу:', error);
        return;
      }
    }

    const messagePayload = {
      userId,
      text,
      fileUrl,
      chatType,
      roomId: chatType === 'room' ? selectedId : undefined,
      channelId: chatType === 'channel' ? selectedId : undefined,
      recipientId: chatType === 'private' ? selectedId : undefined
    };

    console.log('Надсилання повідомлення:', messagePayload); // Для дебагу

    socket.emit('sendMessage', messagePayload);

    setText('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const allMessages = [...messages, ...liveMessages].sort((a, b) => 
    new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
  );

  return (
    <div className="flex flex-col flex-1 h-screen bg-gray-900 text-white">
      <header className="p-4 bg-gray-800 border-b border-gray-700">
        <h2 className="text-xl font-semibold">{selectedName}</h2>
        <p className="text-sm text-gray-400">
          {chatType === 'global' && 'Глобальний чат'}
          {chatType === 'room' && 'Кімната'}
          {chatType === 'channel' && 'Канал'}
          {chatType === 'private' && 'Приватна розмова'}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-950">
        {allMessages.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            Повідомлень поки немає. Будьте першим!
          </div>
        ) : (
          allMessages.map((msg) => (
            <div key={msg._id} className="bg-gray-800 p-3 rounded shadow flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-bold">
                {usernames[msg.userId]?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm text-gray-400">
                  <span className="font-semibold text-gray-300">
                    {usernames[msg.userId] || 'Завантаження...'}
                  </span>
                  <span>{formatDate(msg.createdAt)}</span>
                </div>
                {msg.text && (
                  <p className="text-white mt-1">{msg.text}</p>
                )}
                {msg.fileUrl && (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm inline-block mt-1 hover:text-blue-300"
                  >
                    📎 Файл
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      <footer className="p-4 border-t border-gray-700 bg-gray-800 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ваше повідомлення..."
          className="flex-1 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() && !file}
          className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Надіслати
        </button>
      </footer>
    </div>
  );
}



