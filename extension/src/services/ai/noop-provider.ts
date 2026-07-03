import type { AiProvider } from "@/services/ai/provider";
import type { SaveBookmarkInput } from "@/types";

/**
 * Default provider: does nothing, costs nothing. Keeps every call site
 * unconditional (`await ai.enrich(...)`) so enabling real AI later is
 * a one-line registry change.
 */
export class NoopAiProvider implements AiProvider {
  readonly id = "noop";
  readonly available = false;

  async suggestTags(): Promise<string[]> {
    return [];
  }

  async summarize(): Promise<string | null> {
    return null;
  }

  async generateNote(): Promise<string | null> {
    return null;
  }

  async findSimilar(): Promise<string[]> {
    return [];
  }

  async isSemanticDuplicate(): Promise<boolean> {
    return false;
  }

  async semanticSearch(): Promise<string[]> {
    return [];
  }

  async enrich(input: SaveBookmarkInput): Promise<SaveBookmarkInput> {
    return input;
  }
}
