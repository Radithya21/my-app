import { NavLink } from "react-router-dom";
import {
  Home,
  CreditCard,
  Calendar,
  Target,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { useAIStore } from "../../store/useAIStore";
import { useUIStore } from "../../store/useUIStore";

const NAV_ITEMS = [
  { to: "/", icon: <Home size={19} />, label: "Home" },
  { to: "/todo", icon: <CheckSquare size={19} />, label: "To-Do" },
  { to: "/debt", icon: <CreditCard size={19} />, label: "Hutang" },
  { to: "/goals", icon: <Target size={19} />, label: "Tujuan" },
  { to: "/schedule", icon: <Calendar size={19} />, label: "Sibuk" },
];

export function BottomNav() {
  const { openCommandBar, digestUnread } = useAIStore();
  const hasApiKey = !!useUIStore((s) => s.groqApiKey);

  return (
    <>
      {/* Floating AI button — only when API key is set */}
      {hasApiKey && (
        <div
          className="md:hidden fixed z-50"
          style={{
            bottom: "calc(64px + env(safe-area-inset-bottom) + 12px)",
            right: "16px",
          }}
        >
          <button
            onClick={openCommandBar}
            aria-label="Buka AI Command Bar"
            className="relative w-12 h-12 rounded-full bg-accent shadow-lg shadow-accent/40 flex items-center justify-center text-white transition-transform active:scale-90"
          >
            <Sparkles size={20} />
            {digestUnread && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-white rounded-full border-2 border-accent" />
            )}
          </button>
        </div>
      )}

      {/* Bottom nav bar — always 5 items */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bg-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-stretch h-16">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                [
                  "flex-1 flex flex-col items-center justify-center gap-0.5 text-[11px] transition-colors duration-150",
                  isActive ? "text-accent" : "text-text-muted",
                ].join(" ")
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
