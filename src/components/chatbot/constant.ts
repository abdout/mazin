import type { ChatbotConfig, ChatbotDictionary, ChatbotTheme } from './type';

// Logical positioning — `start`/`end` flip with `dir` for RTL (Arabic).
export const CHATBOT_POSITIONS = {
  'bottom-right': 'fixed bottom-1 end-1 sm:bottom-2 sm:end-2',
  'bottom-left': 'fixed bottom-1 start-1 sm:bottom-2 sm:start-2',
  'top-right': 'fixed top-1 end-1 sm:top-2 sm:end-2',
  'top-left': 'fixed top-1 start-1 sm:top-2 sm:start-2',
} as const;

export const CHAT_WINDOW_POSITIONS = {
  'bottom-right': 'fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:bottom-4 sm:end-2 sm:top-auto',
  'bottom-left': 'fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:bottom-4 sm:start-2 sm:top-auto',
  'top-right': 'fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:top-20 sm:end-2',
  'top-left': 'fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:translate-y-0 sm:top-20 sm:start-2',
} as const;

export const CHAT_WINDOW_SIZE = {
  width: 'w-auto sm:w-80',
  height: 'h-[400px] sm:h-[450px]',
  maxHeight: 'max-h-[80vh] sm:max-h-[80vh]',
} as const;

export const DEFAULT_DICTIONARY: ChatbotDictionary = {
  openChat: 'Open chat',
  closeChat: 'Close chat',
  placeholder: 'Ask about customs clearance...',
  welcomeMessage:
    "Hello! I'm the ABDOUT GROUP assistant. Ask about ACD, SSMO, documents, duties, or your shipment.",
  noMessages: 'No messages yet. Start a conversation!',
  errorMessage: 'Sorry, something went wrong. Please try again.',
  typing: 'Typing...',
  send: 'Send',
  sendMessage: 'Send message',
  voiceInput: 'Voice input',
  retry: 'Retry',
  chooseQuestion: 'Choose a question or type your message',
  speechNotSupported: 'Speech recognition is not supported in your browser.',
  speechError: 'Speech recognition error. Please try again.',
  listening: 'Listening...',
  ttsEnabled: 'Text-to-speech enabled',
  ttsDisabled: 'Text-to-speech disabled',

  // Marketing quick-asks
  marketingDocuments: 'Documents',
  marketingDocumentsQuestion: 'What documents do I need for import clearance at Port Sudan?',
  marketingAcd: 'ACD',
  marketingAcdQuestion: 'What is the Advance Cargo Declaration (ACD) and when is it mandatory?',
  marketingTimeline: 'Timeline',
  marketingTimelineQuestion: 'How long does customs clearance take from vessel arrival to release?',
  marketingQuote: 'Get Quote',
  marketingQuoteQuestion: 'I need a quote for clearing a shipment at Port Sudan.',
  marketingSsmo: 'SSMO',
  marketingSsmoQuestion: 'Which products require SSMO pre-shipment inspection?',
  marketingFees: 'Fees',
  marketingFeesQuestion: 'What are the typical fees for clearing a 40ft container?',

  // Tracking quick-asks
  trackingCurrentStage: 'Current Stage',
  trackingCurrentStageQuestion: 'What is happening with my shipment right now?',
  trackingNext: 'Next Step',
  trackingNextQuestion: 'What is the next step in my clearance?',
  trackingDocs: 'Documents',
  trackingDocsQuestion: 'Which documents are still needed for my shipment?',
  trackingEta: 'ETA',
  trackingEtaQuestion: 'When will my shipment be released?',

  // Platform quick-asks
  platformAcd: 'ACD Status',
  platformAcdQuestion: 'Check ACD status and deadlines for this project.',
  platformDuty: 'Duty Estimate',
  platformDutyQuestion: 'How do I calculate duties for this shipment?',
  platformInvoices: 'Invoices',
  platformInvoicesQuestion: 'Show me unpaid invoices for this project.',
  platformCompliance: 'Compliance',
  platformComplianceQuestion: 'What compliance items are outstanding for this project?',

  // Legacy structure — preserved so older JSON still parses.
  quickActions: {
    track: 'Track',
    trackQuestion: 'I want to track my shipment',
    rates: 'Documents',
    ratesQuestion: 'What documents do I need for customs clearance?',
    delivery: 'Timeline',
    deliveryQuestion: 'How long does the clearance process take?',
    contact: 'Quote',
    contactQuestion: 'I need a quote for customs clearance',
  },
};

export const DEFAULT_THEME: ChatbotTheme = {
  primaryColor: 'hsl(var(--primary))',
  backgroundColor: 'hsl(var(--background))',
  textColor: 'hsl(var(--foreground))',
  borderRadius: '0.5rem',
  fontFamily: 'inherit',
  buttonSize: 'lg',
  windowWidth: 'w-full sm:w-96',
  windowHeight: 'h-[400px] sm:h-[450px]',
  shadowLevel: 'xl',
};

export const DEFAULT_CONFIG: Required<ChatbotConfig> = {
  position: 'bottom-right',
  welcomeMessage:
    "Hello! I'm the ABDOUT GROUP assistant. Ask about ACD, SSMO, documents, duties, or your shipment.",
  placeholder: 'Ask about customs clearance...',
  title: 'ABDOUT Assistant',
  subtitle: 'Port Sudan customs clearance',
  locale: 'en',
  dictionary: DEFAULT_DICTIONARY,
  theme: DEFAULT_THEME,
  avatar: '/robot.png',
  api: {
    endpoint: '/api/chat',
    model: 'llama-3.1-8b-instant',
    systemPrompt: 'You are a helpful assistant.',
    maxTokens: 1000,
    temperature: 0.7,
    headers: {},
  },
  enableTypingIndicator: true,
  enableTimestamps: false,
  enableSounds: false,
  enablePersistence: false,
  autoOpen: false,
  autoOpenDelay: 3000,
  maxMessages: 100,
  storageKey: 'chatbot-messages',
};

export const BUTTON_SIZES = {
  sm: 'h-12 w-12 p-2',
  md: 'h-14 w-14 p-3',
  lg: 'h-16 w-16 p-3',
} as const;

export const ICON_SIZES = {
  sm: 'h-6 w-6',
  md: 'h-7 w-7',
  lg: 'h-8 w-8',
} as const;

export const SHADOW_LEVELS = {
  none: 'shadow-none',
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-2xl',
} as const;

export const ANIMATION_DURATION = 200;
export const MAX_MESSAGE_LENGTH = 1000;
export const TYPING_INDICATOR_DELAY = 1000;
