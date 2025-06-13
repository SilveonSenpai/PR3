import { useEffect, useState } from 'react';
import CreateRoomModal from './CreateRoomModal';
import CreateChannelModal from './CreateChannelModal';
import StartPrivateChat from './StartPrivateChat';
import SearchJoinModal from './SearchJoinModal';

interface ChatItem {
  _id: string;
  name: string;
}

interface Props {
  userId: string;
  onSelect: (type: 'global' | 'room' | 'channel' | 'private', id?: string, label?: string) => void;
  onLogout: () => void;
}

interface Conversation {
  _id: string;
  username?: string;
}

export default function Sidebar({ userId, onSelect, onLogout }: Props) {
  const [rooms, setRooms] = useState<ChatItem[]>([]);
  const [channels, setChannels] = useState<ChatItem[]>([]);
  const [conversations, setConversations] = useState<ChatItem[]>([]);

  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showPrivateSearch, setShowPrivateSearch] = useState(false);

  const [searchRoom, setSearchRoom] = useState('');
  const [searchChannel, setSearchChannel] = useState('');
  const [showSearchJoin, setShowSearchJoin] = useState(false);

  const refreshData = () => {
    fetch(`/api/rooms?userId=${userId}`)
      .then(res => res.json())
      .then(data => setRooms(Array.isArray(data) ? data : data.rooms || []))
      .catch(() => setRooms([]));

    fetch(`/api/channels?userId=${userId}`)
      .then(res => res.json())
      .then(data => setChannels(Array.isArray(data) ? data : data.channels || []))
      .catch(() => setChannels([]));

    fetch(`/api/private-messages/conversations?userId=${userId}`)
      .then(res => res.json())
      .then(async (data) => {
        const raw = Array.isArray(data) ? data : data.conversations || [];
        const enriched = await Promise.all(raw.map(async (conv: any) => {
          const id = conv.userId || conv._id;
          let name = conv.username;
          if (!name) {
            try {
              const res = await fetch(`/api/users/${id}`);
              const user = await res.json();
              name = user.username || `User ${id}`;
            } catch {
              name = `User ${id}`;
            }
          }
          return { _id: id, name };
        }));
        setConversations(enriched);
      })
      .catch(() => setConversations([]));
  };

  useEffect(() => {
    refreshData();
  }, [userId]);

  const filteredRooms = rooms.filter(r => r.name.toLowerCase().includes(searchRoom.toLowerCase()));
  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchChannel.toLowerCase()));

  return (
    <aside className="w-64 bg-gray-900 text-white border-r border-gray-800 p-4 flex flex-col gap-4 shadow-sm sidebar">
      <button onClick={() => onSelect('global')} className="text-left hover:bg-gray-700 p-2 rounded">
        🌐 Глобальний чат
      </button>

      <div>
        <div className="flex justify-between items-center mb-1">
          <p className="font-bold">Кімнати</p>
          <button onClick={() => setShowCreateRoom(true)} className="text-sm text-blue-400 hover:underline">➕</button>
        </div>
        <input
          type="text"
          value={searchRoom}
          onChange={(e) => setSearchRoom(e.target.value)}
          placeholder="Пошук кімнат"
          className="w-full mb-2 p-1 rounded bg-gray-800 text-sm"
        />
        {filteredRooms.map(r => (
          <button 
            key={r._id}
            onClick={() => onSelect('room', r._id, r.name)} 
            className="block w-full text-left hover:bg-gray-700 p-2 rounded"
          >
            🏠 {r.name}
          </button>
        ))}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <p className="font-bold">Канали</p>
          <button onClick={() => setShowCreateChannel(true)} className="text-sm text-blue-400 hover:underline">➕</button>
        </div>
        <input
          type="text"
          value={searchChannel}
          onChange={(e) => setSearchChannel(e.target.value)}
          placeholder="Пошук каналів"
          className="w-full mb-2 p-1 rounded bg-gray-800 text-sm"
        />
        {filteredChannels.map(c => (
          <button 
            key={c._id}
            onClick={() => onSelect('channel', c._id, c.name)} 
            className="block w-full text-left hover:bg-gray-700 p-2 rounded"
          >
            📢 {c.name}
          </button>
        ))}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <p className="font-bold">Приватні</p>
          <button onClick={() => setShowPrivateSearch(true)} className="text-sm text-blue-400 hover:underline">🔍</button>
        </div>
        {conversations.map(c => (
          <button 
            key={c._id}
            onClick={() => onSelect('private', c._id, c.name)} 
            className="block w-full text-left hover:bg-gray-700 p-2 rounded"
          >
            🔒 {c.name}
          </button>
        ))}
      </div>
  <button 
  onClick={() => setShowSearchJoin(true)} 
  className="text-sm text-green-400 hover:underline"
>
  🔍 Пошук
  </button>
      <button
        onClick={onLogout}
        className="mt-auto bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
      >
        🚪 Вийти
      </button>

      {showCreateRoom && (
        <CreateRoomModal
          userId={userId}
          onClose={() => setShowCreateRoom(false)}
          onCreated={refreshData}
        />
      )}

      {showCreateChannel && (
        <CreateChannelModal
          userId={userId}
          onClose={() => setShowCreateChannel(false)}
          onCreated={refreshData}
        />
      )}
      {showSearchJoin && (
  <SearchJoinModal
    userId={userId}
    onClose={() => setShowSearchJoin(false)}
    onJoined={refreshData}
    onSelect={onSelect} // для автопереходу до приєднаної кімнати/каналу
  />
)}

      {showPrivateSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className="bg-gray-800 p-4 rounded w-[400px]">
            <h2 className="text-white text-lg mb-2">Пошук користувача</h2>
            <StartPrivateChat
              userId={userId}
              onSelect={(recipientId, username) => {
                setShowPrivateSearch(false);
                onSelect('private', recipientId, username);
                refreshData();
              }}
            />
            <button onClick={() => setShowPrivateSearch(false)} className="mt-4 bg-gray-600 px-4 py-2 rounded text-white">Закрити</button>
          </div>
        </div>
      )}
    </aside>
  );
}



