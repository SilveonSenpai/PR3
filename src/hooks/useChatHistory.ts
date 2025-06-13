
import { useEffect, useState } from 'react';

export type ChatType = 'global' | 'room' | 'channel' | 'private';

export interface Message {
  _id: string;
  text: string;
  fileUrl?: string;
  userId: string;
  chatType?: ChatType;
  createdAt?: string;
  roomId?: string;
  channelId?: string;
  recipientId?: string;
}

export function useChatHistory(chatType: ChatType, selectedId: string | undefined, userId: string) {
  const [messages, setMessages] = useState<Message[]>([]);

  const loadMessages = async () => {
    // Додано перевірку, щоб не робити зайвих запитів
    if (!userId || (chatType !== 'global' && !selectedId)) {
      setMessages([]);
      return;
    }

    let url = '/api/messages'; // URL за замовчуванням для глобального чату

    // ✔️ ВИПРАВЛЕНО: Додано параметр `?userId=${userId}` до URL для кімнат та каналів
    if (chatType === 'room' && selectedId) {
      url = `/api/rooms/${selectedId}/messages?userId=${userId}`;
    } else if (chatType === 'channel' && selectedId) {
      url = `/api/channels/${selectedId}/messages?userId=${userId}`;
    } else if (chatType === 'private' && selectedId) {
      url = `/api/private-messages?userId=${userId}&otherUserId=${selectedId}`;
    }

    try {
      const res = await fetch(url);
      
      // ✔️ ДОДАНО: Перевірка на успішність HTTP-відповіді
      if (!res.ok) {
        throw new Error(`Помилка сервера: ${res.statusText} (${res.status})`);
      }

      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch (error) {
      console.error('Помилка завантаження історії чату:', error);
      setMessages([]); // Очищуємо повідомлення у разі помилки
    }
  };

  useEffect(() => {
    // Перезавантажуємо повідомлення при зміні чату
    loadMessages();
  }, [chatType, selectedId, userId]);

  return { messages, reload: loadMessages };
}
