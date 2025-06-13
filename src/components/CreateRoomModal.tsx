import { useState } from 'react';

interface Props {
  userId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateRoomModal({ userId, onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return setError('Назва обов’язкова');

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, userId })
    });

    const data = await res.json();
    if (res.ok) {
      onCreated();
      onClose();
    } else {
      setError(data.error || 'Помилка створення');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded w-96 text-white">
        <h2 className="text-xl font-bold mb-4">Створити кімнату</h2>
        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
        <input
          type="text"
          placeholder="Назва кімнати"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 p-2 rounded bg-gray-700 border border-gray-600"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-gray-600 px-4 py-2 rounded">Скасувати</button>
          <button onClick={handleCreate} className="bg-blue-600 px-4 py-2 rounded">Створити</button>
        </div>
      </div>
    </div>
  );
}

