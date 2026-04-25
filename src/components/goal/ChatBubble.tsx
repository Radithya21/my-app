import type { GoalChatMessage } from '../../types'

interface ChatBubbleProps {
  message: GoalChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'
  const time = new Date(message.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={['flex', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      <div className={[
        'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
        isUser
          ? 'bg-accent text-white rounded-br-sm'
          : 'bg-bg-secondary text-text-primary rounded-bl-sm',
      ].join(' ')}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={['text-[10px] mt-1', isUser ? 'text-white/60 text-right' : 'text-text-muted'].join(' ')}>
          {time}
        </p>
      </div>
    </div>
  )
}
