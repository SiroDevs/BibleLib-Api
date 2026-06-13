export class ValidationUtils {
  /**
   * Splits a comma-separated path param into trimmed, non-empty string ids.
   * Used for book/chapter/verse ids, e.g. "GEN,EXO,LEV" or "GEN.1,GEN.2".
   */
  static parseStringIds(ids: string): string[] {
    return ids
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }

  static isValidStringId(id: any): boolean {
    return typeof id === 'string' && id.trim().length > 0;
  }

  static isBulkOperation(data: any): data is any[] {
    return Array.isArray(data);
  }

  static parsePagination(query: any): { page: number; limit: number } {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(query.limit) || 500));
    return { page, limit };
  }

  /**
   * Validates the payload for creating/updating a Bible (bible-info.json `data`).
   * `id`/`bibleId` is deliberately NOT required here — BibleLib generates it.
   */
  static validateBibleData(data: any): string | null {
    if (!data.name) return 'name is required';
    if (!data.abbreviation) return 'abbreviation is required';
    if (!data.language || !data.language.id) return 'language.id is required';
    if (!data.language.name) return 'language.name is required';
    return null;
  }

  /**
   * Validates a single book entry (bible-books.json `data[]`).
   */
  static validateBookData(data: any): string | null {
    if (!data.id) return 'id is required';
    if (!data.name) return 'name is required';
    return null;
  }

  /**
   * Validates a single chapter entry (bible-chapters.json `<BOOK>[]`).
   */
  static validateChapterData(data: any): string | null {
    if (!data.id) return 'id is required';
    if (!data.bookId) return 'bookId is required';
    if (!data.number) return 'number is required';
    return null;
  }

  /**
   * Validates a single verse/chapter-content entry (bible-verses.json `<BOOK>.<CHAPTER>`).
   */
  static validateVerseData(data: any): string | null {
    if (!data.id) return 'id is required';
    if (!data.bookId) return 'bookId is required';
    if (!data.number) return 'number is required';
    if (data.content !== undefined && !Array.isArray(data.content)) {
      return 'content must be an array';
    }
    return null;
  }
}
