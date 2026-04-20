'use client';

import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useChatbot } from './use-chatbot';
import { ChatButton } from './chat-button';
import { ChatWindow } from './chat-window';
import { DEFAULT_CONFIG, DEFAULT_DICTIONARY } from './constant';
import type { ChatbotProps, ChatbotDictionary, PromptType } from './type';
import type { MazinQuickAskFlags } from './prompts';
import { useLocale } from '@/components/internationalization/use-locale';

interface ChatbotContentProps extends ChatbotProps {
  dictionary?: Partial<ChatbotDictionary>;
  promptType?: PromptType;
  trackingIdentifier?: string;
  projectId?: string;
  quickAskFlags?: MazinQuickAskFlags | null;
}

export const ChatbotContent = forwardRef<
  { openChat: () => void },
  ChatbotContentProps
>(({
  config = DEFAULT_CONFIG,
  onMessageSend,
  onChatOpen,
  onChatClose,
  dictionary = {},
  promptType = 'marketing',
  trackingIdentifier,
  projectId,
  quickAskFlags,
}, ref) => {
  const { locale } = useLocale();
  const chatbotConfig = { ...DEFAULT_CONFIG, ...config, locale: locale as 'en' | 'ar' };
  const fullDictionary = { ...DEFAULT_DICTIONARY, ...dictionary } as ChatbotDictionary;

  const {
    state,
    toggleChat,
    openChat,
    closeChat,
    sendMessage,
  } = useChatbot({
    promptType,
    trackingIdentifier,
    projectId,
    locale,
  });

  useImperativeHandle(ref, () => ({ openChat }), [openChat]);

  useEffect(() => {
    if (state.isOpen && onChatOpen) {
      onChatOpen();
    } else if (!state.isOpen && onChatClose) {
      onChatClose();
    }
  }, [state.isOpen, onChatOpen, onChatClose]);

  useEffect(() => {
    const handleOpenChatbot = () => openChat();
    window.addEventListener('open-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-chatbot', handleOpenChatbot);
  }, [openChat]);

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
    if (onMessageSend) {
      onMessageSend(message);
    }
  };

  return (
    <>
      <ChatButton
        onClick={toggleChat}
        isOpen={state.isOpen}
        position={chatbotConfig.position}
        locale={chatbotConfig.locale}
        dictionary={fullDictionary}
      />

      <ChatWindow
        isOpen={state.isOpen}
        onClose={closeChat}
        messages={state.messages}
        onSendMessage={handleSendMessage}
        isLoading={state.isLoading}
        error={state.error}
        placeholder={chatbotConfig.placeholder}
        locale={chatbotConfig.locale}
        dictionary={fullDictionary}
        promptType={promptType}
        quickAskFlags={quickAskFlags ?? null}
      />
    </>
  );
});

ChatbotContent.displayName = 'ChatbotContent';
