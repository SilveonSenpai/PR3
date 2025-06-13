import { useState, useEffect } from 'react';

interface SearchResult {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  memberCount?: number;
  subscriberCount?: number;
}

interface Props {
  userId: string;
  onClose: () => void;
  onJoined: () => void;
  onSelect?: (type: 'room' | 'channel', id: string, name: string) => void;
}

export default function SearchJoinModal({ userId, onClose, onJoined, onSelect }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'rooms' | 'channels'>('rooms');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState<string | null>(null);

  const searchItems = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const endpoint = searchType === 'rooms' 
        ? `/api/rooms/search?q=${encodeURIComponent(searchQuery)}` 
        : `/api/channels/search?search=${encodeURIComponent(searchQuery)}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();

      if (response.ok) {
        setResults(Array.isArray(data) ? data : []);
      } else {
        setError(data.error || 'Помилка пошуку');
        setResults([]);
      }
    } catch (err) {
      setError('Помилка з\'єднання');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchItems();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchType]);

  const handleJoin = async (item: SearchResult) => {
    setJoinLoading(item._id);
    setError('');

    try {
      const endpoint = searchType === 'rooms' 
        ? `/api/rooms/${item._id}/join`
        : `/api/channels/${item._id}/subscribe`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok) {
        onJoined(); // Оновлюємо Sidebar
        
        // Якщо передано onSelect, автоматично переходимо до приєднаної кімнати/каналу
        if (onSelect) {
          onSelect(searchType === 'rooms' ? 'room' : 'channel', item._id, item.name);
        }
        
        onClose();
      } else {
        setError(data.error || 'Помилка приєднання');
      }
    } catch (err) {
      setError('Помилка з\'єднання');
    } finally {
      setJoinLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded w-[500px] max-h-[600px] text-white flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Пошук та приєднання</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Переключення типу пошуку */}
        <div className="flex mb-4 bg-gray-700 rounded">
          <button
            onClick={() => setSearchType('rooms')}
            className={`flex-1 py-2 px-4 rounded-l ${
              searchType === 'rooms' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            🏠 Кімнати
          </button>
          <button
            onClick={() => setSearchType('channels')}
            className={`flex-1 py-2 px-4 rounded-r ${
              searchType === 'channels' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            📢 Канали
          </button>
        </div>

        {/* Поле пошуку */}
        <input
          type="text"
          placeholder={`Пошук ${searchType === 'rooms' ? 'кімнат' : 'каналів'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full mb-4 p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:outline-none"
        />

        {/* Повідомлення про помилку */}
        {error && (
          <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}

        {/* Результати пошуку */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Пошук...
            </div>
          ) : results.length === 0 ? (
            searchQuery.trim() ? (
              <div className="text-center py-8 text-gray-400">
                Нічого не знайдено
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Введіть запит для пошуку
              </div>
            )
          ) : (
            <div className="space-y-2">
              {results.map((item) => (
                <div
                  key={item._id}
                  className="flex justify-between items-center p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.name}</span>
                      {item.isPrivate && (
                        <span className="text-xs bg-yellow-600 px-2 py-1 rounded">
                          Приватний
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {searchType === 'rooms' 
                        ? `${item.memberCount || 0} учасників`
                        : `${item.subscriberCount || 0} підписників`
                      }
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleJoin(item)}
                    disabled={joinLoading === item._id}
                    className="ml-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    {joinLoading === item._id ? (
                      'Приєднання...'
                    ) : searchType === 'rooms' ? (
                      'Увійти'
                    ) : (
                      'Підписатись'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка закриття */}
        <div className="flex justify-end mt-4 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition-colors"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}