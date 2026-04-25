interface ChatStreamingBubbleProps {
  content: string
}

export function ChatStreamingBubble({ content }: ChatStreamingBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm leading-relaxed bg-bg-secondary text-text-primary">
        <p className="whitespace-pre-wrap">
          {content}
          <span className="inline-block w-0.5 h-3.5 bg-text-primary ml-0.5 align-text-bottom animate-pulse" />
        </p>
      </div>
    </div>
  )
}
