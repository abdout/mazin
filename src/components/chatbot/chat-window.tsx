'use client';

import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CHAT_WINDOW_POSITIONS, CHAT_WINDOW_SIZE } from './constant';
import type { ChatWindowProps } from './type';
import {
  CalculatorIcon,
  ContactIcon,
  DocumentIcon,
  PriceIcon,
  SendIcon,
  ShieldIcon,
  TimeIcon,
  TrackIcon,
  VoiceIcon,
  VolumeIcon,
  VolumeOffIcon,
} from './icons';

export const ChatWindow = memo(function ChatWindow({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  isLoading,
  error,
  locale,
  dictionary,
  promptType = 'marketing',
  quickAskFlags,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const isRTL = locale === 'ar';

  // Context-aware quick-ask buttons — pick the right set per promptType.
  const quickAskButtons = useMemo(() => {
    if (promptType === 'tracking') {
      const buttons = [
        { label: dictionary.trackingCurrentStage, question: dictionary.trackingCurrentStageQuestion, icon: TrackIcon },
        { label: dictionary.trackingNext, question: dictionary.trackingNextQuestion, icon: TimeIcon },
        { label: dictionary.trackingDocs, question: dictionary.trackingDocsQuestion, icon: DocumentIcon },
        { label: dictionary.trackingEta, question: dictionary.trackingEtaQuestion, icon: ContactIcon },
      ];
      return buttons.slice(0, 4);
    }

    if (promptType === 'platform') {
      const buttons = [
        { label: dictionary.platformAcd, question: dictionary.platformAcdQuestion, icon: ShieldIcon },
        { label: dictionary.platformDuty, question: dictionary.platformDutyQuestion, icon: CalculatorIcon },
        { label: dictionary.platformInvoices, question: dictionary.platformInvoicesQuestion, icon: PriceIcon },
        { label: dictionary.platformCompliance, question: dictionary.platformComplianceQuestion, icon: DocumentIcon },
      ];
      return buttons.slice(0, 4);
    }

    // Marketing (default). Swap Timeline/Quote for SSMO/Fees when relevant.
    const buttons = [
      { label: dictionary.marketingDocuments, question: dictionary.marketingDocumentsQuestion, icon: DocumentIcon },
      { label: dictionary.marketingAcd, question: dictionary.marketingAcdQuestion, icon: ShieldIcon },
    ];

    if (quickAskFlags?.needsSsmo) {
      buttons.push({ label: dictionary.marketingSsmo, question: dictionary.marketingSsmoQuestion, icon: ShieldIcon });
    } else {
      buttons.push({ label: dictionary.marketingTimeline, question: dictionary.marketingTimelineQuestion, icon: TimeIcon });
    }

    buttons.push({ label: dictionary.marketingQuote, question: dictionary.marketingQuoteQuestion, icon: PriceIcon });

    return buttons.slice(0, 4);
  }, [promptType, dictionary, quickAskFlags]);

  // Speech recognition — single instance, cleaned up when locale changes.
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as unknown as any).webkitSpeechRecognition || (window as unknown as any).SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = locale === 'ar' ? 'ar-SA' : 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript;
        else interim += result[0].transcript;
      }

      if (final) {
        setTranscript('');
        setIsListening(false);
        onSendMessage(final.trim());
      } else if (interim) {
        setTranscript(interim);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setTranscript('');
    };
    recognition.onend = () => {
      setIsListening(false);
      setTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // ignore if not started
      }
      recognitionRef.current = null;
    };
  }, [locale, onSendMessage]);

  // TTS — speak new assistant messages with language-matched voice.
  useEffect(() => {
    if (
      !ttsEnabled ||
      messages.length <= prevMessagesLengthRef.current ||
      !('speechSynthesis' in window)
    ) {
      prevMessagesLengthRef.current = messages.length;
      return;
    }

    const last = messages[messages.length - 1];
    if (last?.role === 'assistant' && last.content) {
      const utterance = new SpeechSynthesisUtterance(last.content);
      utterance.lang = locale === 'ar' ? 'ar-SA' : 'en-US';
      const voices = window.speechSynthesis.getVoices();
      const prefix = locale === 'ar' ? 'ar' : 'en';
      const match = voices.find(v => v.lang.startsWith(prefix));
      if (match) utterance.voice = match;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, ttsEnabled, locale]);

  useEffect(() => {
    if (!ttsEnabled && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [ttsEnabled]);

  useEffect(() => {
    if (isOpen && !isMobile && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      setKeyboardOpen(initialViewportHeight - currentHeight > 150);
    };

    const handleFocus = () => {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    } else {
      window.addEventListener('resize', handleViewportChange);
    }

    const el = inputRef.current;
    if (el) el.addEventListener('focus', handleFocus);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      } else {
        window.removeEventListener('resize', handleViewportChange);
      }
      if (el) el.removeEventListener('focus', handleFocus);
    };
  }, [isMobile]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatWindowRef.current && !chatWindowRef.current.contains(event.target as Node) && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSendMessage(input.trim());
        setInput('');
      }
    },
    [input, isLoading, onSendMessage]
  );

  const handleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) {
      alert(dictionary.speechNotSupported);
      return;
    }

    if (isLoading) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore if not started
      }
      setIsListening(false);
      setTranscript('');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setTranscript('');
    }
  }, [isListening, isLoading, dictionary.speechNotSupported]);

  const handleTtsToggle = useCallback(() => setTtsEnabled(prev => !prev), []);

  return (
    <div
      ref={chatWindowRef}
      className={cn(
        isMobile
          ? 'fixed inset-0 z-[10000] bg-background flex flex-col'
          : cn(
              CHAT_WINDOW_POSITIONS['bottom-right'],
              CHAT_WINDOW_SIZE.width,
              CHAT_WINDOW_SIZE.height,
              'z-[9999] bg-background border rounded-lg shadow-2xl flex flex-col',
              'max-h-[80vh]'
            ),
        'transform transition-all duration-700 ease-in-out',
        isRTL ? 'sm:origin-bottom-left' : 'sm:origin-bottom-right',
        isOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-0 invisible pointer-events-none'
      )}
      style={{
        transformOrigin: isMobile ? 'center' : isRTL ? 'bottom left' : 'bottom right',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        ...(isMobile && isOpen ? { height: keyboardOpen ? '100vh' : '100dvh', minHeight: '100vh' } : {}),
      }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {isMobile && (
        <div className="flex items-center justify-start p-4">
          <button
            onClick={onClose}
            className="flex items-center justify-center h-10 w-10 rounded-full hover:bg-accent transition-colors"
            aria-label={dictionary.closeChat}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn(isRTL && 'rotate-180')}
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
      )}

      <ScrollArea
        className={cn('flex-1 overflow-y-auto overflow-x-hidden', isMobile ? 'px-4 pt-2 pb-1' : 'px-4 pt-2 pb-1')}
        ref={scrollAreaRef}
      >
        <div className="h-full flex flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-col h-full">
              {isMobile ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <p className="mb-6 text-center text-muted-foreground text-sm font-medium">
                    <span>{dictionary.chooseQuestion}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full px-2 max-w-sm">
                    {quickAskButtons.map((btn, i) => (
                      <Button
                        key={i}
                        variant="secondary"
                        size="sm"
                        onClick={() => onSendMessage(btn.question)}
                        className="text-xs h-auto py-2.5 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                      >
                        <btn.icon size={16} />
                        <span>{btn.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1" />
              )}
            </div>
          ) : (
            <div className="space-y-4 pb-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex gap-2',
                    message.role === 'user' ? (isRTL ? 'flex-row' : 'flex-row-reverse') : ''
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">AI</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-3 py-2 max-w-[80%] break-words',
                      message.role === 'user' ? 'bg-primary text-white ms-auto' : 'bg-muted'
                    )}
                  >
                    <p className={cn('text-sm whitespace-pre-wrap', message.role === 'user' && 'text-white')}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {transcript && (
        <div className="text-muted-foreground bg-muted/50 px-4 py-2 text-sm italic">
          {transcript}
        </div>
      )}

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div
        className={cn(
          'bg-background',
          isMobile ? 'px-3 py-3' : 'px-3 pb-2 pt-2',
          isMobile && keyboardOpen && 'pb-1'
        )}
        style={{
          ...(isMobile && keyboardOpen ? { position: 'fixed', bottom: '0', insetInlineStart: '0', insetInlineEnd: '0', zIndex: 10001 } : {}),
        }}
      >
        {!isMobile && messages.length === 0 && (
          <div className="mb-3">
            <div className="grid grid-cols-2 gap-2 w-full">
              {quickAskButtons.map((btn, i) => (
                <Button
                  key={i}
                  variant="secondary"
                  size="sm"
                  onClick={() => onSendMessage(btn.question)}
                  className="text-xs h-auto py-2 px-3 flex items-center gap-2 bg-muted hover:bg-muted/80 border-0"
                >
                  <btn.icon size={14} />
                  <span>{btn.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex items-center border border-muted-foreground rounded-lg px-3 bg-background relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              placeholder={dictionary.placeholder}
              className={cn(
                'w-full bg-transparent border-none outline-none',
                isMobile ? 'text-[16px] h-10 py-2' : 'text-sm py-2 h-8'
              )}
              dir={isRTL ? 'rtl' : 'ltr'}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              inputMode="text"
              aria-label={dictionary.placeholder}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                'hover:scale-110 transition-transform shrink-0 disabled:opacity-50 disabled:hover:scale-100',
                isMobile ? 'h-12 w-12' : 'h-10 w-10'
              )}
              title={dictionary.sendMessage}
              aria-label={dictionary.sendMessage}
            >
              <SendIcon size={isMobile ? 32 : 20} className={cn(isRTL && 'scale-x-[-1]')} />
            </button>

            <button
              type="button"
              onClick={handleVoiceInput}
              disabled={isLoading}
              className={cn(
                'hover:scale-110 transition-transform shrink-0 disabled:opacity-50',
                isMobile ? 'h-12 w-12' : 'h-10 w-10',
                isListening && 'text-red-500 animate-pulse'
              )}
              title={isListening ? dictionary.listening : dictionary.voiceInput}
              aria-label={isListening ? dictionary.listening : dictionary.voiceInput}
            >
              <VoiceIcon size={isMobile ? 32 : 20} />
            </button>

            <button
              type="button"
              onClick={handleTtsToggle}
              className={cn(
                'hover:scale-110 transition-transform shrink-0',
                isMobile ? 'h-12 w-12' : 'h-10 w-10',
                ttsEnabled && 'text-primary'
              )}
              title={ttsEnabled ? dictionary.ttsEnabled : dictionary.ttsDisabled}
              aria-label={ttsEnabled ? dictionary.ttsEnabled : dictionary.ttsDisabled}
            >
              {ttsEnabled ? (
                <VolumeIcon size={isMobile ? 32 : 20} />
              ) : (
                <VolumeOffIcon size={isMobile ? 32 : 20} />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
