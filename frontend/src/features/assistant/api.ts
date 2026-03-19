import { api } from "../../api/client";
import type { AssistantChatPayload, AssistantChatResponse } from "./types";

export const sendAssistantMessage = async (
  payload: AssistantChatPayload
): Promise<AssistantChatResponse> => {
  const response = await api.post<AssistantChatResponse>("/assistant/chat", payload);
  return response.data;
};
