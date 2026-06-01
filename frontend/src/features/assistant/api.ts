import { api } from "../../api/client";
import type {
  AssistantChatPayload,
  AssistantChatResponse,
  AssistantConversationPayload,
  AssistantConversationUpdatePayload,
  AssistantConversation,
  AssistantTaskActionPayload,
  AssistantTaskActionResponse,
} from "./types";

export const listAssistantConversations = async (
  search = ""
): Promise<AssistantConversation[]> => {
  const response = await api.get<AssistantConversation[]>("/assistant/conversations", {
    params: search ? { q: search } : undefined,
  });
  return response.data;
};

export const getAssistantConversation = async (
  id: number
): Promise<AssistantConversation> => {
  const response = await api.get<AssistantConversation>(`/assistant/conversations/${id}`);
  return response.data;
};

export const createAssistantConversation = async (
  payload: AssistantConversationPayload = {}
): Promise<AssistantConversation> => {
  const response = await api.post<AssistantConversation>("/assistant/conversations", payload);
  return response.data;
};

export const updateAssistantConversation = async (
  id: number,
  payload: AssistantConversationUpdatePayload
): Promise<AssistantConversation> => {
  const response = await api.patch<AssistantConversation>(
    `/assistant/conversations/${id}`,
    payload
  );
  return response.data;
};

export const deleteAssistantConversation = async (id: number): Promise<void> => {
  await api.delete(`/assistant/conversations/${id}`);
};

export const sendAssistantMessage = async (
  payload: AssistantChatPayload
): Promise<AssistantChatResponse> => {
  const response = await api.post<AssistantChatResponse>("/assistant/chat", payload);
  return response.data;
};

export const createAssistantTask = async (
  payload: AssistantTaskActionPayload
): Promise<AssistantTaskActionResponse> => {
  const response = await api.post<AssistantTaskActionResponse>("/assistant/tasks", payload);
  return response.data;
};
