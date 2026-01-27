/**
 * Message Routes - /message/*
 * Handles sending messages to sellers (used by n8n Negotiator)
 */
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { messageService } from "../services/message.service";
import { SendMessageRequest } from "../types/message.types";

interface SendMessageBody {
    email: string;
    articleId: string;
    receiverId?: string;
    message: string;
}

interface GetConversationsParams {
    email: string;
}

export async function messageRoutes(app: FastifyInstance): Promise<void> {
    /**
     * POST /message/send
     * Send a message to a seller for a specific article
     * Used by n8n Negotiator workflow
     */
    app.post(
        "/message/send",
        async (
            request: FastifyRequest<{ Body: SendMessageBody }>,
            reply: FastifyReply
        ) => {
            const { email, articleId, receiverId, message } = request.body;

            // Validation
            if (!email) {
                return reply.status(400).send({
                    success: false,
                    error: "email is required",
                });
            }

            if (!articleId) {
                return reply.status(400).send({
                    success: false,
                    error: "articleId is required",
                });
            }

            if (!message) {
                return reply.status(400).send({
                    success: false,
                    error: "message is required",
                });
            }

            console.log(`📤 POST /message/send - Article: ${articleId}`);

            try {
                const sendRequest: SendMessageRequest = {
                    email,
                    articleId,
                    message,
                    ...(receiverId !== undefined && { receiverId }),
                };

                const result = await messageService.sendMessage(sendRequest);

                if (result.success) {
                    return reply.status(200).send(result);
                } else {
                    return reply.status(400).send(result);
                }
            } catch (error) {
                console.error("Error in /message/send:", error);
                return reply.status(500).send({
                    success: false,
                    status: "failed",
                    message: "Internal server error",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    );

    /**
     * GET /message/conversations/:email
     * Get list of active conversations for a user
     */
    app.get(
        "/message/conversations/:email",
        async (
            request: FastifyRequest<{ Params: GetConversationsParams }>,
            reply: FastifyReply
        ) => {
            const { email } = request.params;

            if (!email) {
                return reply.status(400).send({
                    success: false,
                    error: "email parameter is required",
                });
            }

            console.log(`📋 GET /message/conversations/${email}`);

            try {
                const conversations = await messageService.getConversations(email);

                return reply.status(200).send({
                    success: true,
                    email,
                    conversationCount: conversations.length,
                    conversations,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Error getting conversations:", error);
                return reply.status(500).send({
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    );

    /**
     * GET /message/health
     * Health check for message service
     */
    app.get("/message/health", async (_request, reply: FastifyReply) => {
        return reply.status(200).send({
            status: "ok",
            service: "message",
            timestamp: new Date().toISOString(),
        });
    });
}
