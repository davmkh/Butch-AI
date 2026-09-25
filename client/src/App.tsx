import { butchApi } from './api/butchApi.ts';
import { ChatWindow } from './components/ChatWindow.tsx';
import { Composer } from './components/Composer.tsx';
import { Header } from './components/Header.tsx';
import { QuickReplyBar } from './components/QuickReplyBar.tsx';
import { useChat } from './hooks/useChat.ts';
import { useQuickPrompts } from './hooks/useQuickPrompts.ts';

export default function App() {
  const { messages, status, send, reset, rate } = useChat(butchApi);
  const { prompts, remember } = useQuickPrompts(butchApi);
  const busy = status === 'thinking';

  const ask = (text: string) => {
    remember(text);
    void send(text);
  };

  return (
    <div className="flex h-dvh flex-col">
      <Header mascotState={busy ? 'thinking' : 'idle'} onNewConversation={reset} />
      <main className="flex min-h-0 flex-1 flex-col">
        <ChatWindow messages={messages} status={status} onRate={rate} />
        <div className="border-t border-wsu-black-30 bg-wsu-surface pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <QuickReplyBar prompts={prompts} onPick={ask} busy={busy} />
          <Composer onSend={ask} busy={busy} />
          <p className="px-4 text-center text-xs text-wsu-gray">
            Butch can make mistakes, so check the linked WSU sources. Chats are saved anonymously to
            improve Butch; please don't share personal information. A student project, not an
            official WSU service.
          </p>
        </div>
      </main>
    </div>
  );
}
