import { FastifyInstance } from "fastify";
import {
  ListingRecord,
  MessageGenerationOptions,
  PriceAnalysis,
  SearchCriteria,
} from "../../shared/sniper-types";
import { loadAppConfig } from "../services/app-config";
import { SniperAnalyzerService } from "../services/sniper-analyzer.service";
import { SniperMessageService } from "../services/sniper-message.service";
import { messageService } from "../services/message.service";

interface AnalyzeBody {
  listing: ListingRecord;
  criteria?: SearchCriteria;
}

interface GenerateMessageBody {
  listing: ListingRecord;
  criteria?: SearchCriteria;
  priceAnalysis?: PriceAnalysis;
  options?: MessageGenerationOptions;
}

interface TestBody {
  listing: ListingRecord;
  criteria?: SearchCriteria;
  options?: MessageGenerationOptions;
  sendLive?: boolean;
  accountEmail?: string;
  articleId?: string;
  receiverId?: string;
}

function isListingRecord(value: unknown): value is ListingRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate["id"] === "string" &&
    typeof candidate["platform"] === "string" &&
    typeof candidate["title"] === "string" &&
    typeof candidate["url"] === "string" &&
    Array.isArray(candidate["images"])
  );
}

export async function sniperRoutes(app: FastifyInstance): Promise<void> {
  const analyzer = new SniperAnalyzerService();
  const messageGenerator = new SniperMessageService();

  app.get("/sniper/capabilities", async (_request, reply) => {
    return reply.send({
      status: "success",
      capabilities: {
        listingMonitoring: "existing_search_scraper",
        filterEvaluation: "heuristic_live",
        priceAnalysis: "heuristic_live",
        fakeDetection: "heuristic_live",
        messageGeneration: "template_live",
        autoSend: "existing_message_service",
        manualApproval: "supported_in_decision_model",
        aiIntegration: "planned_via_external_api",
        multiTenantSchema: "prepared",
      },
      endpoints: [
        "POST /sniper/analyze",
        "POST /sniper/generate-message",
        "POST /sniper/test",
      ],
      timestamp: new Date().toISOString(),
    });
  });

  app.post<{ Body: AnalyzeBody }>("/sniper/analyze", async (request, reply) => {
    const { listing, criteria } = request.body;

    if (!isListingRecord(listing)) {
      return reply.status(400).send({
        status: "error",
        message: "listing payload is required and must match the sniper model",
      });
    }

    const analysis = analyzer.analyze(listing, criteria);

    return reply.send({
      status: "success",
      analysis,
      timestamp: new Date().toISOString(),
    });
  });

  app.post<{ Body: GenerateMessageBody }>(
    "/sniper/generate-message",
    async (request, reply) => {
      const { listing, criteria, priceAnalysis, options } = request.body;

      if (!isListingRecord(listing)) {
        return reply.status(400).send({
          status: "error",
          message: "listing payload is required and must match the sniper model",
        });
      }

      const draft = messageGenerator.generateMessage(
        listing,
        criteria,
        priceAnalysis,
        options
      );

      return reply.send({
        status: "success",
        draft,
        timestamp: new Date().toISOString(),
      });
    }
  );

  app.post<{ Body: TestBody }>("/sniper/test", async (request, reply) => {
    const {
      listing,
      criteria,
      options,
      sendLive = false,
      accountEmail,
      articleId,
      receiverId,
    } = request.body;

    if (!isListingRecord(listing)) {
      return reply.status(400).send({
        status: "error",
        message: "listing payload is required and must match the sniper model",
      });
    }

    const analysis = analyzer.analyze(listing, criteria);
    const draft = messageGenerator.generateMessage(
      listing,
      criteria,
      analysis.priceAnalysis,
      options
    );
    const configuredEmail = accountEmail || loadAppConfig().accountEmail;
    let liveSendResult: unknown = null;

    if (sendLive) {
      if (!configuredEmail) {
        return reply.status(400).send({
          status: "error",
          message: "sendLive requires an accountEmail or configured default account",
        });
      }

      if (!analysis.decision.shouldSendAutomatically) {
        return reply.status(400).send({
          status: "error",
          message:
            "Listing is not eligible for automatic sending according to the current analysis",
          analysis,
          draft,
        });
      }

      const targetArticleId = articleId || listing.externalId || listing.id;
      liveSendResult = await messageService.sendMessage({
        email: configuredEmail,
        articleId: targetArticleId,
        receiverId,
        message: draft.text,
      });
    }

    return reply.send({
      status: "success",
      mode: sendLive ? "live_send" : "dry_run",
      analysis,
      draft,
      liveSendResult,
      timestamp: new Date().toISOString(),
    });
  });
}
