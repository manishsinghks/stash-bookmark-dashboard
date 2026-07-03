import type { AiProvider } from "@/services/ai/provider";
import { NoopAiProvider } from "@/services/ai/noop-provider";

let activeProvider: AiProvider = new NoopAiProvider();

/** Future: registerAiProvider(new DashboardAiProvider(...)) at startup. */
export function registerAiProvider(provider: AiProvider): void {
  activeProvider = provider;
}

export function ai(): AiProvider {
  return activeProvider;
}

export type { AiProvider } from "@/services/ai/provider";
