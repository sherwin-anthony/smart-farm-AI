export type AssistantChatPayload = {
  message: string;
  farm_id?: number | null;
};

export type AssistantChatResponse = {
  reply: string;
  context_used?: Record<string, unknown>;
};
