import type { PageMetadata, SaveBookmarkInput } from "@/types";

/**
 * Contract for future AI features. UI and save flows depend only on
 * this interface — swapping in a real provider (local model, dashboard
 * endpoint, cloud API) requires zero UI changes.
 */
export interface AiProvider {
  readonly id: string;
  readonly available: boolean;

  /** Suggest tags for a page about to be saved. */
  suggestTags(page: PageMetadata): Promise<string[]>;

  /** One-paragraph summary for the notes field. */
  summarize(page: PageMetadata): Promise<string | null>;

  /** Auto-generated note (e.g. "why you might have saved this"). */
  generateNote(page: PageMetadata): Promise<string | null>;

  /** IDs of semantically similar existing bookmarks. */
  findSimilar(page: PageMetadata, limit?: number): Promise<string[]>;

  /** Meaning-level duplicate check (beyond exact URL match). */
  isSemanticDuplicate(page: PageMetadata): Promise<boolean>;

  /** Free-text semantic search over the library. */
  semanticSearch(query: string, limit?: number): Promise<string[]>;

  /** Hook to enrich a save payload (tags, summary) in one pass. */
  enrich(input: SaveBookmarkInput, page: PageMetadata): Promise<SaveBookmarkInput>;
}
