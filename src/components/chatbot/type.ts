import type { MazinQuickAskFlags, PromptType } from './prompts';

export type { PromptType } from './prompts';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

export interface ChatbotState {
  isOpen: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error?: string;
}

export interface ChatbotTheme {
  primaryColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: string;
  fontFamily?: string;
  buttonSize?: 'sm' | 'md' | 'lg';
  windowWidth?: string;
  windowHeight?: string;
  shadowLevel?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

export interface ChatbotAPIConfig {
  endpoint?: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  headers?: Record<string, string>;
}

/**
 * Flattened dictionary surface.
 * UI components read keys via optional chaining so adding keys here does not
 * force every JSON locale to ship them immediately.
 */
export interface ChatbotDictionary {
  openChat: string;
  closeChat: string;
  placeholder: string;
  welcomeMessage: string;
  noMessages: string;
  errorMessage: string;
  typing: string;
  send: string;
  sendMessage: string;
  voiceInput: string;
  retry: string;
  chooseQuestion: string;
  speechNotSupported: string;
  speechError: string;
  listening: string;
  ttsEnabled: string;
  ttsDisabled: string;
  // Marketing quick-asks (customs clearance default)
  marketingDocuments: string;
  marketingDocumentsQuestion: string;
  marketingAcd: string;
  marketingAcdQuestion: string;
  marketingTimeline: string;
  marketingTimelineQuestion: string;
  marketingQuote: string;
  marketingQuoteQuestion: string;
  marketingSsmo: string;
  marketingSsmoQuestion: string;
  marketingFees: string;
  marketingFeesQuestion: string;
  // Tracking quick-asks
  trackingCurrentStage: string;
  trackingCurrentStageQuestion: string;
  trackingNext: string;
  trackingNextQuestion: string;
  trackingDocs: string;
  trackingDocsQuestion: string;
  trackingEta: string;
  trackingEtaQuestion: string;
  // Platform quick-asks
  platformAcd: string;
  platformAcdQuestion: string;
  platformDuty: string;
  platformDutyQuestion: string;
  platformInvoices: string;
  platformInvoicesQuestion: string;
  platformCompliance: string;
  platformComplianceQuestion: string;
  // Legacy (kept for compatibility)
  quickActions?: {
    track: string;
    trackQuestion: string;
    rates: string;
    ratesQuestion: string;
    delivery: string;
    deliveryQuestion: string;
    contact: string;
    contactQuestion: string;
  };
}

export interface ChatbotConfig {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  welcomeMessage?: string;
  placeholder?: string;
  title?: string;
  subtitle?: string;
  locale?: 'en' | 'ar';
  dictionary?: Partial<ChatbotDictionary>;
  theme?: ChatbotTheme;
  avatar?: string;
  api?: ChatbotAPIConfig;
  enableTypingIndicator?: boolean;
  enableTimestamps?: boolean;
  enableSounds?: boolean;
  enablePersistence?: boolean;
  autoOpen?: boolean;
  autoOpenDelay?: number;
  maxMessages?: number;
  storageKey?: string;
}

export interface ChatbotProps {
  config?: ChatbotConfig;
  className?: string;
  promptType?: PromptType;
  trackingIdentifier?: string;
  projectId?: string;
  onMessageSend?: (message: string) => void;
  onChatOpen?: () => void;
  onChatClose?: () => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
}

export interface ChatButtonProps {
  onClick: () => void;
  isOpen: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  locale?: 'en' | 'ar';
  dictionary: ChatbotDictionary;
  theme?: ChatbotTheme;
  avatar?: string;
}

export interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error?: string;
  placeholder?: string;
  locale?: 'en' | 'ar';
  dictionary: ChatbotDictionary;
  theme?: ChatbotTheme;
  title?: string;
  subtitle?: string;
  promptType?: PromptType;
  quickAskFlags?: MazinQuickAskFlags | null;
  enableTypingIndicator?: boolean;
  enableTimestamps?: boolean;
}

export interface ChatbotHookConfig {
  apiEndpoint?: string;
  onError?: (error: string) => void;
  enablePersistence?: boolean;
  storageKey?: string;
  maxMessages?: number;
}
