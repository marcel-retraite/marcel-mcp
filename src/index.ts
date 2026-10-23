#!/usr/bin/env node

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  PromptListChangedNotificationSchema,
  ReadResourceRequestSchema,
  ResourceListChangedNotificationSchema,
  ResourceUpdatedNotificationSchema,
  SubscribeRequestSchema,
  ToolListChangedNotificationSchema,
  UnsubscribeRequestSchema,
  type ServerCapabilities,
} from "@modelcontextprotocol/sdk/types.js";

const DEFAULT_REMOTE_URL = "https://marcel-retraite.fr/mcp";
const SERVER_NAME = "marcel-mcp";
const SERVER_VERSION = "1.3.0";
const SSE_HEADER_TIMEOUT_MS = 4_000;

/**
 * POST carries Streamable HTTP messages. A standalone GET is only the optional
 * listening stream opened after `notifications/initialized`. The hosted
 * endpoint keeps that GET open until the platform times out. Wait briefly for
 * response headers; if they do not arrive, or the GET fails, answer 405 so
 * tool calls stay on POST. A listening stream that responds in time is passed
 * through.
 */
async function fetchRemote(input: string | URL, init?: RequestInit): Promise<Response> {
  const method = (init?.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    return fetch(input, init);
  }

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), SSE_HEADER_TIMEOUT_MS);
  const signal = init?.signal ? AbortSignal.any([init.signal, timeout.signal]) : timeout.signal;

  try {
    const response = await fetch(input, { ...init, signal });
    clearTimeout(timer);
    return response;
  } catch (error) {
    clearTimeout(timer);
    if (init?.signal?.aborted === true) {
      throw error;
    }
    return new Response(null, { status: 405, statusText: "Method Not Allowed" });
  }
}

function remoteUrl(): URL {
  const raw = process.env.MARCEL_MCP_URL?.trim() || DEFAULT_REMOTE_URL;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    console.error("marcel-mcp: MARCEL_MCP_URL is not a valid URL");
    process.exit(1);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    console.error("marcel-mcp: MARCEL_MCP_URL must use http or https");
    process.exit(1);
  }
  return url;
}

function describeTarget(url: URL): string {
  return `${url.origin}${url.pathname}`;
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function forwardedCapabilities(remoteCaps: ServerCapabilities): ServerCapabilities {
  const capabilities: ServerCapabilities = {};

  if (remoteCaps.tools) {
    capabilities.tools = remoteCaps.tools.listChanged ? { listChanged: true } : {};
  }
  if (remoteCaps.prompts) {
    capabilities.prompts = remoteCaps.prompts.listChanged ? { listChanged: true } : {};
  }
  if (remoteCaps.resources) {
    capabilities.resources = {};
    if (remoteCaps.resources.subscribe) {
      capabilities.resources.subscribe = true;
    }
    if (remoteCaps.resources.listChanged) {
      capabilities.resources.listChanged = true;
    }
  }

  return capabilities;
}

async function main(): Promise<void> {
  const url = remoteUrl();
  const remote = new Client({ name: SERVER_NAME, version: SERVER_VERSION });
  const http = new StreamableHTTPClientTransport(url, { fetch: fetchRemote });

  try {
    await remote.connect(http, { timeout: 20_000 });
  } catch (error) {
    console.error(
      `marcel-mcp: unable to reach ${describeTarget(url)}: ${errorText(error)}`,
    );
    process.exit(1);
  }

  const remoteCaps = remote.getServerCapabilities() ?? {};
  const instructions = remote.getInstructions();
  const server = new Server(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: forwardedCapabilities(remoteCaps),
      ...(instructions ? { instructions } : {}),
    },
  );

  if (remoteCaps.tools) {
    server.setRequestHandler(ListToolsRequestSchema, async (request, extra) => {
      return remote.listTools(request.params, { signal: extra.signal });
    });
    server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
      const progressToken = extra._meta?.progressToken;
      return remote.callTool(request.params, undefined, {
        signal: extra.signal,
        onprogress:
          progressToken === undefined
            ? undefined
            : (progress) => {
                void extra
                  .sendNotification({
                    method: "notifications/progress",
                    params: {
                      progressToken,
                      progress: progress.progress,
                      ...(progress.total === undefined ? {} : { total: progress.total }),
                      ...(progress.message === undefined ? {} : { message: progress.message }),
                    },
                  })
                  .catch((error: unknown) => {
                    console.error(
                      `marcel-mcp: progress notification failed: ${errorText(error)}`,
                    );
                  });
              },
      });
    });
  }

  if (remoteCaps.prompts) {
    server.setRequestHandler(ListPromptsRequestSchema, async (request, extra) => {
      return remote.listPrompts(request.params, { signal: extra.signal });
    });
    server.setRequestHandler(GetPromptRequestSchema, async (request, extra) => {
      return remote.getPrompt(request.params, { signal: extra.signal });
    });
  }

  if (remoteCaps.resources) {
    server.setRequestHandler(ListResourcesRequestSchema, async (request, extra) => {
      return remote.listResources(request.params, { signal: extra.signal });
    });
    server.setRequestHandler(ReadResourceRequestSchema, async (request, extra) => {
      return remote.readResource(request.params, { signal: extra.signal });
    });
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async (request, extra) => {
      return remote.listResourceTemplates(request.params, { signal: extra.signal });
    });
    if (remoteCaps.resources.subscribe) {
      server.setRequestHandler(SubscribeRequestSchema, async (request, extra) => {
        return remote.subscribeResource(request.params, { signal: extra.signal });
      });
      server.setRequestHandler(UnsubscribeRequestSchema, async (request, extra) => {
        return remote.unsubscribeResource(request.params, { signal: extra.signal });
      });
    }
  }

  let closed = false;
  const shutdown = async (code: number): Promise<void> => {
    if (closed) {
      return;
    }
    closed = true;
    await Promise.allSettled([server.close(), remote.close()]);
    process.exit(code);
  };

  if (remoteCaps.tools?.listChanged) {
    remote.setNotificationHandler(ToolListChangedNotificationSchema, async () => {
      if (closed) {
        return;
      }
      await server.notification({ method: "notifications/tools/list_changed" });
    });
  }
  if (remoteCaps.prompts?.listChanged) {
    remote.setNotificationHandler(PromptListChangedNotificationSchema, async () => {
      if (closed) {
        return;
      }
      await server.notification({ method: "notifications/prompts/list_changed" });
    });
  }
  if (remoteCaps.resources?.listChanged) {
    remote.setNotificationHandler(ResourceListChangedNotificationSchema, async () => {
      if (closed) {
        return;
      }
      await server.notification({ method: "notifications/resources/list_changed" });
    });
  }
  if (remoteCaps.resources?.subscribe) {
    remote.setNotificationHandler(ResourceUpdatedNotificationSchema, async (notification) => {
      if (closed) {
        return;
      }
      await server.notification({
        method: "notifications/resources/updated",
        params: notification.params,
      });
    });
  }

  remote.onerror = (error) => {
    if (closed) {
      return;
    }
    console.error(`marcel-mcp: remote error: ${errorText(error)}`);
  };

  const stdio = new StdioServerTransport();
  stdio.onclose = () => {
    void shutdown(0);
  };
  stdio.onerror = (error) => {
    console.error(`marcel-mcp: stdio transport error: ${errorText(error)}`);
  };

  process.stdin.on("end", () => {
    void shutdown(0);
  });

  await server.connect(stdio);

  process.on("SIGINT", () => {
    void shutdown(0);
  });
  process.on("SIGTERM", () => {
    void shutdown(0);
  });
}

main().catch((error: unknown) => {
  console.error(`marcel-mcp: ${errorText(error)}`);
  process.exit(1);
});
