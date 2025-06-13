import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import io, { Socket } from 'socket.io-client';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import Sidebar from './components/Sidebar';
import { ChatType } from './hooks/useChatHistory';

const socket: Socket = io('http://localhost:3000');

function MainApp() {
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));
  const [chatType, setChatType] = useState<ChatType>('global');
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [selectedName, setSelectedName] = useState<string>('Глобальний чат');
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      socket.emit('authenticate', { userId });
    } else {
      localStorage.removeItem('userId');
      navigate('/login');
    }
  }, [userId]); //ігнорь цю холєру вона не ламає ніц

  const handleSelect = (type: ChatType, id?: string, label?: string) => {
    setChatType(type);
    setSelectedId(id);
    setSelectedName(label || 'Глобальний чат');
  };

  if (!userId) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <Sidebar userId={userId} onSelect={handleSelect} onLogout={() => setUserId(null)} />
      <ChatPage
        socket={socket}
        userId={userId}
        chatType={chatType}
        selectedId={selectedId}
        selectedName={selectedName}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <LoginPage
              setUserId={(id: string) => {
                localStorage.setItem('userId', id);
                window.location.href = '/';
              }}
            />
          }
        />
        <Route path="*" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

