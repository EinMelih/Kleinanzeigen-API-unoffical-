/**
 * Token Routes - /tokens/*
 * Handles JWT token analysis
 */
import { FastifyInstance } from "fastify";
import { TokenAnalyzer } from "../services/tokens-analyze";

export async function tokenRoutes(app: FastifyInstance): Promise<void> {
  // GET /tokens/analyze/:email - Analyze JWT tokens and expiry times
  app.get<{ Params: { email: string } }>(
    "/tokens/analyze/:email",
    async (request, reply) => {
      try {
        const { email } = request.params;
        const analyzer = new TokenAnalyzer();
        const summary = await analyzer.getTokenSummary(email);

        return reply.send({
          status: "success",
          summary,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        request.log.error({ err }, "token analysis failed");
        return reply.status(500).send({
          status: "error",
          message: err instanceof Error ? err.message : "Token analysis failed",
        });
      }
    }
  );
}
