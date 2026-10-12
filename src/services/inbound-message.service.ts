
import { createContact } from "./contact.service.js";
import { getOrCreateConversation } from "./conversation.service.js";
import { createMessage } from "./message.service.js";

interface ReceivePatientMessageInput {
  clinicId: string;
  phone: string;
  messageText: string;
}

export async function receivePatientMessage(
  input: ReceivePatientMessageInput,
) {
  const { clinicId, phone, messageText } = input;

  // 1. Find the existing patient or create a new contact.
  const { contact } = await createContact({
    clinicId,
    phone,
  });

  // 2. Find the active conversation or create one.
  const { conversation } = await getOrCreateConversation({
    clinicId,
    contactId: contact.id,
    channel: "SIMULATOR",
  });

  // 3. Save the incoming message.
  const message = await createMessage({
    conversationId: conversation.id,
    direction: "INBOUND",
    senderType: "CUSTOMER",
    content: messageText,
  });

  return {
    contact,
    conversation,
    message,
  };
}
