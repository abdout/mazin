import { getDictionary } from '@/components/internationalization/dictionaries';
import type { Locale } from '@/components/internationalization/config';
import { ChatbotContent } from './content';
import {
  getPlatformChatbotContext,
  getTrackingChatbotContext,
} from './actions';
import { deriveQuickAskFlags, type MazinChatbotContext } from './prompts';
import type { ChatbotProps, PromptType } from './type';

interface ChatbotWrapperProps extends ChatbotProps {
  lang: Locale;
  promptType?: PromptType;
}

/**
 * Server wrapper — pre-fetches dictionary + optional domain context in parallel
 * so the client shell hydrates with quick-ask buttons that reflect real state.
 */
export async function Chatbot({
  lang,
  promptType = 'marketing',
  trackingIdentifier,
  projectId,
  ...props
}: ChatbotWrapperProps) {
  const [dictionary, tracking, platform] = await Promise.all([
    getDictionary(lang),
    promptType === 'tracking' && trackingIdentifier
      ? getTrackingChatbotContext(trackingIdentifier)
      : Promise.resolve(null),
    promptType === 'platform' && projectId
      ? getPlatformChatbotContext(projectId)
      : Promise.resolve(null),
  ]);

  const context: MazinChatbotContext = {
    promptType,
    tracking: tracking ?? undefined,
    platform: platform ?? undefined,
  };

  return (
    <ChatbotContent
      {...props}
      dictionary={dictionary.chatbot}
      promptType={promptType}
      trackingIdentifier={trackingIdentifier}
      projectId={projectId}
      quickAskFlags={deriveQuickAskFlags(context)}
    />
  );
}
