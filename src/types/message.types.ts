/**
 * Message Types - Types for messaging functionality
 */

export interface SendMessageRequest {
    email: string;           // Dein Login-Email
    articleId: string;       // Kleinanzeigen Artikel-ID
    receiverId?: string | undefined;  // Optional: Verkäufer User-ID
    message: string;         // Nachricht an den Verkäufer
}

export interface SendMessageResponse {
    success: boolean;
    status: 'sent' | 'failed' | 'conversation_opened';
    message: string;
    articleId: string;
    sellerId?: string | undefined;
    conversationUrl?: string | undefined;
    timestamp: string;
    error?: string | undefined;
}

export interface ConversationInfo {
    conversationId: string;
    articleId: string;
    articleTitle: string;
    sellerName: string;
    sellerId: string;
    lastMessage?: string | undefined;
    lastMessageDate?: string | undefined;
    unread?: boolean | undefined;
    conversationUrl?: string | undefined;
    messages?: Array<{
        id: string;
        direction: "in" | "out" | "system";
        text: string;
        timestamp: string;
        status: "sent" | "received" | "system";
    }>;
}
