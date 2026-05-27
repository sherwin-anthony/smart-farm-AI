// Purpose: assistant messages use the authenticated farm context on the backend.
export type AssistantChatPayload = {
  message: string;
};

export type AssistantChatResponse = {
  reply: string;
  context_used?: Record<string, unknown>;
};
