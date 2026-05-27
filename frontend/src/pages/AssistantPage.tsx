import axios from "axios";
import { Bot, Send, WandSparkles } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import PageHeader from "../components/ui/PageHeader";
import { sendAssistantMessage } from "../features/assistant/api";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const getErrorMessage = (value: unknown, fallback: string) => {
  // Assistant errors usually come from auth or missing farm setup.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

// Purpose: crop-aware assistant chat connected to the authenticated farm context.
export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Ask me what needs attention in your crops, tasks, or harvest schedule.",
    },
  ]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!message.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message.trim(),
    };

    try {
      setSubmitting(true);
      setError("");
      setMessages((current) => [...current, userMessage]);
      setMessage("");

      const response = await sendAssistantMessage({ message: userMessage.content });

      setMessages((current) => [
        ...current,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: response.reply,
        },
      ]);
    } catch (submitError) {
      console.error(submitError);
      setError(getErrorMessage(submitError, "Could not send assistant message."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Assistant"
        description="Ask crop-aware questions grounded in your farm, crops, and pending tasks."
      />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">AI workspace</span>
          <span className="card-icon">
            <Bot size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>Farm assistant with crop context</h2>
            <p>
              The assistant now receives recent crop and pending task context from the backend.
            </p>
          </div>
        </div>
      </section>

      {error ? <p className="text-danger">{error}</p> : null}

      <section className="panel-card">
        <div className="grid gap-3">
          {messages.map((item) => (
            <article
              key={item.id}
              className={
                item.role === "assistant"
                  ? "rounded-2xl border border-surface-border bg-surface-soft p-4"
                  : "rounded-2xl bg-primary-600 p-4 text-white"
              }
            >
              <div className="mb-2 flex items-center gap-2">
                <span className={item.role === "assistant" ? "card-icon card-icon-soft" : "card-icon"}>
                  {item.role === "assistant" ? (
                    <WandSparkles size={16} strokeWidth={2.2} />
                  ) : (
                    <Bot size={16} strokeWidth={2.2} />
                  )}
                </span>
                <strong className="text-sm font-semibold">
                  {item.role === "assistant" ? "Assistant" : "You"}
                </strong>
              </div>
              <p className={item.role === "assistant" ? "text-sm text-ink-muted" : "text-sm text-white"}>
                {item.content}
              </p>
            </article>
          ))}
        </div>

        <form className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What should I do for my crops this week?"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70"
            disabled={submitting}
          >
            <Send size={16} strokeWidth={2.2} />
            {submitting ? "Sending..." : "Send"}
          </button>
        </form>
      </section>
    </div>
  );
}
