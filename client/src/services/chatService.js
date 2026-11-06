// client/src/services/chatService.js
import API from "../api/axios";

export const sendChatMessage = async (messages) => {
  try {
    const response = await API.post("/chat", { messages });
    return response.data;
  } catch (error) {
    console.error("[ChatService] Error sending message:", error);
    throw error;
  }
};
