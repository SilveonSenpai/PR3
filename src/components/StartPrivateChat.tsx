import { useEffect, useState } from 'react';

interface Props {
  userId: string;
  onSelect: (recipientId: string, username: string) => void;
}

interface User {
  _id: string;
  username: string;
}

export default function StartPrivateChat({ userId, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);

  useEffect(() => {
    if (search.trim().length === 0) {
      setResults([]);
      return;
    }

    const delay = setTimeout(() => {
      fetch(`/api/users?search=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then((data: User[]) => {
          const filtered = data.filter(user => user._id !== userId);
          setResults(filtered);
        })
        .catch(() => {
          setResults([]);
        });
    }, 400);

    return () => clearTimeout(delay);
  }, [search, userId]);

  return (
    <div className="p-4">
      <input
        type="text"
        placeholder="Пошук користувача за іменем"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600 mb-4"
      />

      <div className="space-y-2">
        {results.map((user) => (
          <button
            key={user._id}
            onClick={() => onSelect(user._id, user.username)}
            className="block w-full text-left bg-gray-700 p-2 rounded hover:bg-gray-600 text-white"
          >
            🔒 {user.username}
          </button>
        ))}
      </div>
    </div>
  );
}
