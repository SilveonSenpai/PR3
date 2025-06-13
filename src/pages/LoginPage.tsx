import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  setUserId: (id: string) => void;
}

export default function LoginPage({ setUserId }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const endpoint = isRegister ? '/api/users/register' : '/api/users/login';
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok && data.userId) {
      localStorage.setItem('userId', data.userId);
      setUserId(data.userId);
      navigate('/chat');
    } else {
      setError(data.error || 'Помилка');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl mb-4 text-center">{isRegister ? 'Реєстрація' : 'Вхід'}</h2>
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <input
          type="text"
          placeholder="Ім’я користувача"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
          required
        />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">
          {isRegister ? 'Зареєструватися' : 'Увійти'}
        </button>
        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="w-full text-sm text-blue-600 mt-2"
        >
          {isRegister ? 'У мене вже є акаунт' : 'Зареєструватися'}
        </button>
      </form>
    </div>
  );
}