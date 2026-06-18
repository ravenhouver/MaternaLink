'use client';

import message from 'antd/es/message';
import { useEffect } from 'react';
import { actionNotificationEvent, type ActionNotificationDetail } from '@/lib/action-notifications';

export function ActionNotificationBridge() {
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const detail = (event as CustomEvent<ActionNotificationDetail>).detail;
      if (!detail) return;

      messageApi.open({
        type: detail.type,
        content: detail.description ? `${detail.message}: ${detail.description}` : detail.message,
        duration: detail.type === 'error' ? 4 : 2.5,
      });
    };

    window.addEventListener(actionNotificationEvent, handleNotification);
    return () => window.removeEventListener(actionNotificationEvent, handleNotification);
  }, [messageApi]);

  return contextHolder;
}
