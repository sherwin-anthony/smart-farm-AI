import axios from "axios";
import {
  Bot,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  ListTodo,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Sprout,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import {
  createAssistantConversation,
  createAssistantTask,
  deleteAssistantConversation,
  getAssistantConversation,
  listAssistantConversations,
  sendAssistantMessage,
  updateAssistantConversation,
} from "../features/assistant/api";
import type {
  AssistantAction,
  AssistantConversation,
  AssistantMessage,
} from "../features/assistant/types";

const quickPrompts = [
  "What should I do today?",
  "Show my overdue tasks.",
  "Which crops are near harvest?",
  "Will weather affect my farm?",
  "Any yield records that need attention?",
];

const getErrorMessage = (value: unknown, fallback: string) => {
  // Assistant errors usually come from auth, missing farm setup, or the AI provider.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

const nowIso = () => new Date().toISOString();

const starterMessage: AssistantMessage = {
  id: 0,
  role: "assistant",
  content: "Ask me what needs attention in your crops, tasks, weather, or harvest schedule.",
  context_payload: null,
  created_at: nowIso(),
  updated_at: nowIso(),
};

const fieldClassName =
  "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70";

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

const contextNumber = (context: Record<string, unknown> | undefined, key: string) => {
  const value = context?.[key];
  return typeof value === "number" ? value : null;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

const isAssistantAction = (value: unknown): value is AssistantAction => {
  const action = asRecord(value);

  return Boolean(
    action &&
      typeof action.key === "string" &&
      typeof action.type === "string" &&
      typeof action.label === "string" &&
      typeof action.title === "string" &&
      typeof action.description === "string"
  );
};

const extractActions = (messages: AssistantMessage[]): AssistantAction[] => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const payload = asRecord(messages[index].context_payload);
    const actions = payload?.actions;

    if (Array.isArray(actions)) {
      return actions.filter(isAssistantAction);
    }
  }

  return [];
};

const extractContext = (messages: AssistantMessage[]) => {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const payload = asRecord(messages[index].context_payload);
    const context = asRecord(payload?.context_used);

    if (context) {
      return context;
    }
  }

  return undefined;
};

const conversationLabel = (conversation: AssistantConversation) =>
  conversation.title?.trim() || `Conversation #${conversation.id}`;

const actionButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70";

// Purpose: farm-aware AI assistant chat connected to authenticated farm context and saved history.
export default function AssistantPage() {
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<AssistantMessage[]>([starterMessage]);
  const [message, setMessage] = useState("");
  const [contextUsed, setContextUsed] = useState<Record<string, unknown>>();
  const [actions, setActions] = useState<AssistantAction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [creatingActionKey, setCreatingActionKey] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  const resetWorkspace = () => {
    setConversationId(null);
    setMessages([starterMessage]);
    setContextUsed(undefined);
    setActions([]);
    setActionMessage("");
  };

  const loadConversation = async (id: number) => {
    const conversation = await getAssistantConversation(id);
    const loadedMessages = conversation.messages?.length ? conversation.messages : [starterMessage];

    setConversationId(conversation.id);
    setMessages(loadedMessages);
    setContextUsed(extractContext(loadedMessages));
    setActions(extractActions(loadedMessages));
    setActionMessage("");
  };

  const loadConversations = async (search = conversationSearch) => {
    const response = await listAssistantConversations(search);
    setConversations(response);
    return response;
  };

  useEffect(() => {
    const loadInitialWorkspace = async () => {
      try {
        setLoadingHistory(true);
        setError("");
        const response = await listAssistantConversations();
        setConversations(response);

        if (response[0]) {
          await loadConversation(response[0].id);
        } else {
          resetWorkspace();
        }
      } catch (loadError) {
        console.error(loadError);
        setError(getErrorMessage(loadError, "Could not load assistant history."));
      } finally {
        setLoadingHistory(false);
      }
    };

    loadInitialWorkspace();
  }, []);

  const contextSummary = useMemo(
    () => ({
      crops: contextNumber(contextUsed, "crop_count"),
      openTasks: contextNumber(contextUsed, "open_task_count"),
      overdueTasks: contextNumber(contextUsed, "overdue_task_count"),
      weatherLoaded: contextUsed?.weather_loaded === true,
      yieldRecords: contextNumber(contextUsed, "yield_record_count"),
    }),
    [contextUsed]
  );

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === conversationId) ?? null,
    [conversationId, conversations]
  );

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();

    if (!trimmed || submitting) {
      return;
    }

    const optimisticUserMessage: AssistantMessage = {
      id: -Date.now(),
      role: "user",
      content: trimmed,
      context_payload: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    try {
      setSubmitting(true);
      setError("");
      setActionMessage("");
      setMessage("");
      setMessages((current) => [...current.filter((item) => item.id !== 0), optimisticUserMessage]);

      const response = await sendAssistantMessage({
        message: trimmed,
        conversation_id: conversationId,
      });

      setConversationId(response.conversation_id);
      setContextUsed(response.context_used);
      setActions(response.actions ?? []);
      setMessages((current) => [
        ...current,
        response.message ?? {
          id: Date.now(),
          role: "assistant",
          content: response.reply,
          context_payload: {
            context_used: response.context_used ?? {},
            actions: response.actions ?? [],
          },
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ]);
      await loadConversations();
    } catch (submitError) {
      console.error(submitError);
      setError(getErrorMessage(submitError, "Could not send assistant message."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await sendMessage(message);
  };

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setLoadingHistory(true);
      setError("");
      await loadConversations(conversationSearch);
    } catch (searchError) {
      console.error(searchError);
      setError(getErrorMessage(searchError, "Could not search conversations."));
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleCreateConversation = async () => {
    try {
      setCreatingConversation(true);
      setError("");
      const conversation = await createAssistantConversation({
        title: "New farm chat",
      });

      setConversations((current) => [conversation, ...current]);
      setConversationId(conversation.id);
      setMessages([starterMessage]);
      setContextUsed(undefined);
      setActions([]);
      setActionMessage("");
    } catch (createError) {
      console.error(createError);
      setError(getErrorMessage(createError, "Could not create conversation."));
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleSelectConversation = async (id: number) => {
    try {
      setLoadingHistory(true);
      setError("");
      await loadConversation(id);
    } catch (loadError) {
      console.error(loadError);
      setError(getErrorMessage(loadError, "Could not open conversation."));
    } finally {
      setLoadingHistory(false);
    }
  };

  const beginRename = (conversation: AssistantConversation) => {
    setRenamingId(conversation.id);
    setRenameTitle(conversationLabel(conversation));
  };

  const handleRename = async (event: FormEvent, conversation: AssistantConversation) => {
    event.preventDefault();
    const title = renameTitle.trim();

    if (!title) {
      return;
    }

    try {
      setError("");
      const updated = await updateAssistantConversation(conversation.id, { title });
      setConversations((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
      setRenamingId(null);
      setRenameTitle("");
    } catch (renameError) {
      console.error(renameError);
      setError(getErrorMessage(renameError, "Could not rename conversation."));
    }
  };

  const handleDelete = async (conversation: AssistantConversation) => {
    if (!window.confirm("Delete this assistant conversation?")) {
      return;
    }

    try {
      setDeletingId(conversation.id);
      setError("");
      await deleteAssistantConversation(conversation.id);

      const remaining = conversations.filter((item) => item.id !== conversation.id);
      setConversations(remaining);

      if (conversation.id === conversationId) {
        if (remaining[0]) {
          await loadConversation(remaining[0].id);
        } else {
          resetWorkspace();
        }
      }
    } catch (deleteError) {
      console.error(deleteError);
      setError(getErrorMessage(deleteError, "Could not delete conversation."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateTask = async (action: AssistantAction) => {
    try {
      setCreatingActionKey(action.key);
      setError("");
      setActionMessage("");

      const response = await createAssistantTask({
        action_key: action.key,
        conversation_id: conversationId,
      });
      const content = response.task
        ? `${response.message} ${response.task.title}`
        : response.message;

      setActionMessage(content);
      setMessages((current) => [
        ...current.filter((item) => item.id !== 0),
        {
          id: -Date.now(),
          role: "assistant",
          content,
          context_payload: {
            assistant_action: response.action ?? action,
            task_id: response.task?.id ?? null,
            created: response.created,
          },
          created_at: nowIso(),
          updated_at: nowIso(),
        },
      ]);
      await loadConversations();
    } catch (createError) {
      console.error(createError);
      setError(getErrorMessage(createError, "Could not create assistant task."));
    } finally {
      setCreatingActionKey(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Assistant"
        description="Ask farm-aware questions grounded in your crops, tasks, weather, recommendations, and yield records."
      />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">Groq-powered farm context</span>
          <span className="card-icon">
            <Bot size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>Farm assistant with real SmartFarm data</h2>
            <p>Replies use your authenticated farm context, chat history, and safe next actions.</p>
          </div>
        </div>
      </section>

      {error ? <p className="text-danger">{error}</p> : null}

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="secondary-button inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold"
            disabled={submitting}
            onClick={() => sendMessage(prompt)}
          >
            <Sparkles size={15} strokeWidth={2.2} />
            {prompt}
          </button>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_18rem]">
        <aside className="panel-card xl:sticky xl:top-24 xl:self-start">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="inline-icon-row">
              <span className="card-icon card-icon-soft">
                <History size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink">Chats</h3>
                <p className="card-copy">Saved farm conversations.</p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70"
              disabled={creatingConversation}
              onClick={handleCreateConversation}
              title="New chat"
            >
              <Plus size={18} strokeWidth={2.2} />
            </button>
          </div>

          <form className="mb-4 grid grid-cols-[1fr_auto] gap-2" onSubmit={handleSearch}>
            <input
              className={fieldClassName}
              value={conversationSearch}
              onChange={(event) => setConversationSearch(event.target.value)}
              placeholder="Search chats"
            />
            <button
              type="submit"
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-surface-border bg-surface-card text-ink transition hover:bg-primary-50"
              title="Search chats"
            >
              <Search size={17} strokeWidth={2.2} />
            </button>
          </form>

          <div className="grid max-h-[28rem] gap-2 overflow-y-auto pr-1">
            {conversations.map((conversation) => {
              const active = conversation.id === conversationId;

              return (
                <article
                  key={conversation.id}
                  className={
                    active
                      ? "rounded-2xl border border-primary-200 bg-primary-50 p-3"
                      : "rounded-2xl border border-surface-border bg-surface-soft p-3"
                  }
                >
                  {renamingId === conversation.id ? (
                    <form className="grid gap-2" onSubmit={(event) => handleRename(event, conversation)}>
                      <input
                        className={fieldClassName}
                        value={renameTitle}
                        onChange={(event) => setRenameTitle(event.target.value)}
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary-600 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-surface-card text-ink"
                          onClick={() => setRenamingId(null)}
                          title="Cancel rename"
                        >
                          <X size={15} strokeWidth={2.2} />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="w-full text-left"
                        onClick={() => handleSelectConversation(conversation.id)}
                      >
                        <strong className="line-clamp-2 text-sm font-semibold text-ink">
                          {conversationLabel(conversation)}
                        </strong>
                        <span className="mt-1 block text-xs text-ink-muted">
                          Updated {formatDate(conversation.updated_at)}
                        </span>
                      </button>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-surface-card text-ink transition hover:bg-primary-50"
                          onClick={() => beginRename(conversation)}
                          title="Rename chat"
                        >
                          <Pencil size={14} strokeWidth={2.2} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-surface-card text-danger transition hover:bg-red-50 disabled:cursor-progress disabled:opacity-70"
                          disabled={deletingId === conversation.id}
                          onClick={() => handleDelete(conversation)}
                          title="Delete chat"
                        >
                          <Trash2 size={14} strokeWidth={2.2} />
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}

            {!loadingHistory && conversations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-surface-border bg-surface-soft p-4 text-sm text-ink-muted">
                No conversations found.
              </p>
            ) : null}
          </div>
        </aside>

        <article className="panel-card">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-icon-row">
              <span className="card-icon card-icon-soft">
                <WandSparkles size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink">
                  {selectedConversation ? conversationLabel(selectedConversation) : "Conversation"}
                </h3>
                <p className="card-copy">Using your farm data automatically.</p>
              </div>
            </div>

            {conversationId ? (
              <span className="card-chip mt-0">
                <History size={14} strokeWidth={2.2} />
                Conversation #{conversationId}
              </span>
            ) : null}
          </div>

          {loadingHistory ? (
            <Loader />
          ) : (
            <div className="grid max-h-[58vh] gap-3 overflow-y-auto pr-1">
              {messages.map((item) => {
                const isUser = item.role === "user";

                return (
                  <article
                    key={item.id}
                    className={
                      isUser
                        ? "ml-auto max-w-[44rem] rounded-2xl bg-primary-600 p-4 text-white"
                        : "max-w-[44rem] rounded-2xl border border-surface-border bg-surface-soft p-4"
                    }
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={isUser ? "card-icon" : "card-icon card-icon-soft"}>
                        {isUser ? (
                          <Bot size={16} strokeWidth={2.2} />
                        ) : (
                          <WandSparkles size={16} strokeWidth={2.2} />
                        )}
                      </span>
                      <strong className="text-sm font-semibold">
                        {isUser ? "You" : "Assistant"}
                      </strong>
                      <span className={isUser ? "text-xs text-white/80" : "text-xs text-ink-muted"}>
                        {formatTime(item.created_at)}
                      </span>
                    </div>
                    <p
                      className={
                        isUser
                          ? "whitespace-pre-wrap text-sm text-white"
                          : "whitespace-pre-wrap text-sm leading-6 text-ink-muted"
                      }
                    >
                      {item.content}
                    </p>
                  </article>
                );
              })}

              {submitting ? (
                <article className="max-w-[44rem] rounded-2xl border border-surface-border bg-surface-soft p-4">
                  <div className="inline-icon-row">
                    <span className="card-icon card-icon-soft">
                      <Clock size={16} strokeWidth={2.2} />
                    </span>
                    <p className="text-sm font-semibold text-ink-muted">Thinking with farm context...</p>
                  </div>
                </article>
              ) : null}
            </div>
          )}

          <form className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]" onSubmit={handleSubmit}>
            <input
              className={fieldClassName}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="What should I prioritize today?"
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
        </article>

        <aside className="grid gap-4 xl:sticky xl:top-24 xl:self-start">
          <section className="panel-card">
            <div className="inline-icon-row">
              <span className="card-icon card-icon-soft">
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink">Context Used</h3>
                <p className="card-copy">Updated after each reply.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <Sprout size={16} strokeWidth={2.2} />
                  <strong className="text-sm font-semibold text-ink">Crops</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {contextSummary.crops ?? "Waiting for reply"}
                </p>
              </div>
              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <ListTodo size={16} strokeWidth={2.2} />
                  <strong className="text-sm font-semibold text-ink">Open Tasks</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {contextSummary.openTasks ?? "Waiting for reply"}
                </p>
              </div>
              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <strong className="text-sm font-semibold text-ink">Overdue</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {contextSummary.overdueTasks ?? "Waiting for reply"}
                </p>
              </div>
              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <strong className="text-sm font-semibold text-ink">Weather</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {contextUsed
                    ? contextSummary.weatherLoaded
                      ? "Loaded"
                      : "Not synced"
                    : "Waiting for reply"}
                </p>
              </div>
              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <strong className="text-sm font-semibold text-ink">Yield Records</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {contextSummary.yieldRecords ?? "Waiting for reply"}
                </p>
              </div>
            </div>
          </section>

          <section className="panel-card">
            <div className="inline-icon-row">
              <span className="card-icon card-icon-soft">
                <Sparkles size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink">Suggested Actions</h3>
                <p className="card-copy">Built from the latest farm context.</p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {actions.map((action) => (
                <article
                  key={action.key}
                  className="rounded-2xl border border-surface-border bg-surface-soft p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="card-icon card-icon-soft">
                      {action.type === "create_task" ? (
                        <ListTodo size={16} strokeWidth={2.2} />
                      ) : (
                        <ExternalLink size={16} strokeWidth={2.2} />
                      )}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-ink">{action.title}</h4>
                      <p className="mt-1 text-sm leading-5 text-ink-muted">{action.description}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    {action.type === "create_task" ? (
                      <button
                        type="button"
                        className={actionButtonClass}
                        disabled={creatingActionKey === action.key}
                        onClick={() => handleCreateTask(action)}
                      >
                        <ListTodo size={15} strokeWidth={2.2} />
                        {creatingActionKey === action.key ? "Creating..." : action.label}
                      </button>
                    ) : action.href ? (
                      <Link className={actionButtonClass} to={action.href}>
                        {action.label}
                        <ExternalLink size={15} strokeWidth={2.2} />
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}

              {actions.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-surface-border bg-surface-soft p-4 text-sm text-ink-muted">
                  Ask a farm question to generate safe next actions.
                </p>
              ) : null}

              {actionMessage ? (
                <p className="rounded-2xl border border-primary-100 bg-primary-50 p-4 text-sm font-medium text-primary-700">
                  {actionMessage}
                </p>
              ) : null}
            </div>
          </section>
        </aside>
      </section>
    </div>
  );
}
