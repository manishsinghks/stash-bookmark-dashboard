import { z } from "zod";

/**
 * Runtime messages between extension contexts (popup/options → background).
 * Every message is validated on receipt — never trust sender payloads.
 */
export const runtimeMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("sync-now") }),
  z.object({ type: z.literal("get-queue-count") }),
]);

export type RuntimeMessage = z.infer<typeof runtimeMessageSchema>;

export interface SyncNowResponse {
  ok: boolean;
  synced: number;
  remaining: number;
  error?: string;
}

export function sendRuntimeMessage<T>(message: RuntimeMessage): Promise<T> {
  return chrome.runtime.sendMessage(message);
}
