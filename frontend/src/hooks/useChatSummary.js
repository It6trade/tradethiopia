import { useCallback, useEffect, useMemo, useState } from 'react';
import { listConversations } from '../services/chatService';
import { useUserStore } from '../store/user';

export const useChatSummary = () => {
  const currentUser = useUserStore((state) => state.currentUser);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!currentUser?.token) return;
    try {
      setLoading(true);
      const response = await listConversations();
      setConversations(response.data || []);
    } catch (error) {
      // Keep launcher resilient; workspace handles user-facing errors.
      console.error('Failed to load chat summary:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.token]);

  useEffect(() => {
    refresh();
    if (!currentUser?.token) return undefined;
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [refresh, currentUser?.token]);

  const summary = useMemo(() => {
    const totals = {
      all: conversations.length,
      contacts: 0,
      groups: 0,
      channels: 0,
      unreadCount: 0,
    };

    conversations.forEach((conversation) => {
      totals.unreadCount += Number(conversation.unreadCount || 0);
      if (conversation.kind === 'direct') totals.contacts += 1;
      if (conversation.kind === 'group') totals.groups += 1;
      if (conversation.kind === 'department') totals.channels += 1;
    });

    return totals;
  }, [conversations]);

  return {
    conversations,
    loading,
    refresh,
    summary,
  };
};
