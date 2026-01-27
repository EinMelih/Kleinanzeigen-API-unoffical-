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
    sellerId?: string;
    conversationUrl?: string;
    timestamp: string;
    error?: string;
}

export interface ConversationInfo {
    conversationId: string;
    articleId: string;
    articleTitle: string;
    sellerName: string;
    sellerId: string;
    lastMessage?: string;
    lastMessageDate?: string;
}
