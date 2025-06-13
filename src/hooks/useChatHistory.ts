
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
    if (!userId || (chatType !== 'global' && !selectedId)) {
      setMessages([]);
      return;
    }

    let url = '/api/messages'; 
    if (chatType === 'room' && selectedId) {
      url = `/api/rooms/${selectedId}/messages?userId=${userId}`;
    } else if (chatType === 'channel' && selectedId) {
      url = `/api/channels/${selectedId}/messages?userId=${userId}`;
    } else if (chatType === 'private' && selectedId) {
      url = `/api/private-messages?userId=${userId}&otherUserId=${selectedId}`;
    }

    try {
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`Помилка сервера: ${res.statusText} (${res.status})`);
      }

      const data = await res.json();
      setMessages(Array.isArray(data) ? data : data.messages || []);
    } catch (error) {
      console.error('Помилка завантаження історії чату:', error);
      setMessages([]); 
    }
  };

  useEffect(() => {
    loadMessages();
  }, [chatType, selectedId, userId]);

  return { messages, reload: loadMessages };
}
