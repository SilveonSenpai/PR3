import { useEffect, useState } from 'react';

interface Message {
  _id: string;
  text: string;
  fileUrl?: string;
  userId: string;
  chatType?: string;
  roomId?: string;
  channelId?: string;
  recipientId?: string;
  createdAt?: string;
}

interface Props {
  messages: Message[];
  currentUserId?: string;
  showReadStatus?: boolean;
}

interface UserMap {
  [userId: string]: string;
}

export default function MessageList({ messages, currentUserId, showReadStatus }: Props) {
  const [usernames, setUsernames] = useState<UserMap>({});

  useEffect(() => {
    const uniqueUserIds = [...new Set(messages.map(msg => msg.userId))];
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
  }, [messages]);

  const formatDate = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const lastOwnMessageId = messages
    .filter(msg => msg.userId === currentUserId)
    .slice(-1)[0]?._id;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-100">
      {messages.map((msg) => (
        <div key={msg._id} className="bg-white p-3 rounded shadow flex gap-3 items-start">
          <div className="w-10 h-10 rounded-full bg-blue-200 text-blue-900 flex items-center justify-center font-bold">
            {usernames[msg.userId]?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{usernames[msg.userId] || '...'}</span>
              <span>{formatDate(msg.createdAt)}</span>
            </div>
            <p className="text-gray-800 mt-1">{msg.text}</p>
            {msg.fileUrl && (
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm inline-block mt-1"
              >
                📎 Переглянути файл
              </a>
            )}
            {showReadStatus && msg._id === lastOwnMessageId && (
              <div className="text-xs text-green-600 mt-1">✓ Прочитано</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

