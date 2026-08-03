import { useLocalDate } from "../../hooks/useLocalDate";
import { formatDate } from "../../utils/formatDate";

function getGreeting(hour: number): { text: string; emoji: string } {
  if (hour < 5) return { text: "Selamat malam", emoji: "🌙" };
  if (hour < 10) return { text: "Selamat pagi", emoji: "☀️" };
  if (hour < 15) return { text: "Selamat siang", emoji: "🌤️" };
  if (hour < 18) return { text: "Selamat sore", emoji: "🌇" };
  return { text: "Selamat malam", emoji: "🌙" };
}

export function GreetingHeader() {
  const now = useLocalDate();
  const { text, emoji } = getGreeting(now.getHours());
  const dateStr = formatDate(now.toISOString());

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
        {text}{" "}
        <span role="img" aria-label="greeting">
          {emoji}
        </span>
      </h1>
      <p className="text-sm text-text-muted mt-0.5">{dateStr}</p>
    </div>
  );
}
