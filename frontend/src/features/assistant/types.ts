import type { Task } from "../tasks/types";

// Purpose: assistant messages use the authenticated farm context on the backend.
export type AssistantRole = "user" | "assistant" | string;

export type AssistantAction = {
  key: string;
  type: "create_task" | "link" | string;
  label: string;
  title: string;
  description: string;
  href: string | null;
  task_payload?: Record<string, unknown> | null;
};

export type AssistantMessage = {
  id: number;
  role: AssistantRole;
  content: string;
  context_payload?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type AssistantConversation = {
  id: number;
  farm_id: number | null;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: AssistantMessage[];
};

export type AssistantChatPayload = {
  message: string;
  conversation_id?: number | null;
};

export type AssistantConversationPayload = {
  title?: string | null;
};

export type AssistantConversationUpdatePayload = {
  title: string;
};

export type AssistantChatResponse = {
  reply: string;
  conversation_id: number;
  context_used?: Record<string, unknown>;
  provider?: string | null;
  model?: string | null;
  actions?: AssistantAction[];
  message?: AssistantMessage;
};

export type AssistantTaskActionPayload = {
  action_key: string;
  conversation_id?: number | null;
};

export type AssistantTaskActionResponse = {
  created: boolean;
  message: string;
  task?: Task;
  action?: AssistantAction;
};
