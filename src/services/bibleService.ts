import { Bible, Book, Chapter, Verse } from '../models';
import { IdService } from './idService';

export class BibleService {
  /**
   * Returns all bibles (summary list — full `info` blob included).
   */
  static async getAllBibles() {
    return await Bible.find().select('-__v').sort({ created: -1 });
  }

  /**
   * Returns a single bible's info, shaped like bible-info.json: { data: {...} }.
   */
  static async getBibleById(bibleId: string) {
    const bible = await Bible.findById(bibleId).select('-__v');
    if (!bible) return null;
    return { data: bible };
  }

  /**
   * Creates a single bible. BibleLib generates the `_id` (bibleId) from the
   * supplied name/abbreviation/language — any `id`/`bibleId` in the payload
   * is ignored.
   */
  static async createSingleBible(bibleData: any) {
    const { id, _id, bibleId, ...rest } = bibleData;
    const generatedId = await IdService.generateBibleId({
      name: rest.name,
      abbreviation: rest.abbreviation,
      language: rest.language,
    });

    const bible = await Bible.create({ _id: generatedId, ...rest });
    return { data: bible };
  }

  static async createMultipleBibles(biblesData: any[]) {
    const createdBibles: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of biblesData.entries()) {
      try {
        if (!item.name || !item.abbreviation || !item.language?.id) {
          errors.push({ index, error: 'name, abbreviation and language.id are required' });
          continue;
        }
        const { data } = await this.createSingleBible(item);
        createdBibles.push(data);
      } catch (error: any) {
        errors.push({
          index,
          error: error.code === 11000 ? 'Duplicate record' : 'Creation failed',
          details: error.message,
        });
      }
    }

    return { createdBibles, errors };
  }

  /**
   * Updates a bible's info. The bibleId (`_id`) is immutable.
   */
  static async updateBible(bibleId: string, updateData: any) {
    const { id, _id, bibleId: bid, ...safeData } = updateData;
    safeData.updated = new Date();
    safeData.updatedAt = new Date();

    const bible = await Bible.findByIdAndUpdate(bibleId, safeData, {
      new: true,
      runValidators: true,
    });

    if (!bible) return null;
    return { data: bible };
  }

  static async updateMultipleBibles(biblesData: any[]) {
    const updateResults: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of biblesData.entries()) {
      try {
        const bibleId = item.id || item.bibleId || item._id;
        if (!bibleId) {
          errors.push({ index, error: 'id (bibleId) is required' });
          continue;
        }
        const result = await this.updateBible(bibleId, item);
        if (!result) {
          errors.push({ index, bibleId, error: 'Bible not found' });
          continue;
        }
        updateResults.push(result.data);
      } catch (error: any) {
        errors.push({
          index,
          error: error.code === 11000 ? 'Duplicate record' : 'Update failed',
          details: error.message,
        });
      }
    }

    return { updateResults, errors };
  }

  /**
   * Deletes a bible and cascades the delete to all of its books, chapters
   * and verses.
   */
  static async deleteBible(bibleId: string) {
    const bible = await Bible.findByIdAndDelete(bibleId);
    if (!bible) return null;

    const [books, chapters, verses] = await Promise.all([
      Book.deleteMany({ bibleId }),
      Chapter.deleteMany({ bibleId }),
      Verse.deleteMany({ bibleId }),
    ]);

    return {
      bible,
      removed: {
        books: books.deletedCount || 0,
        chapters: chapters.deletedCount || 0,
        verses: verses.deletedCount || 0,
      },
    };
  }

  /**
   * Bundles a full bible export shaped exactly like the four source files:
   * bible-info.json, bible-books.json, bible-chapters.json, bible-verses.json.
   */
  static async exportBible(bibleId: string) {
    const bible = await Bible.findById(bibleId).select('-__v');
    if (!bible) return null;

    const [books, chapters, verses] = await Promise.all([
      Book.find({ bibleId }).select('-_id -__v -created -updated').sort({ id: 1 }),
      Chapter.find({ bibleId }).select('-_id -__v -created -updated'),
      Verse.find({ bibleId }).select('-_id -__v -created -updated'),
    ]);

    const chaptersByBook: Record<string, any[]> = {};
    for (const chapter of chapters) {
      const obj = chapter.toObject();
      if (!chaptersByBook[obj.bookId]) chaptersByBook[obj.bookId] = [];
      chaptersByBook[obj.bookId].push(obj);
    }

    const versesByBook: Record<string, Record<string, any>> = {};
    for (const verse of verses) {
      const obj = verse.toObject();
      if (!versesByBook[obj.bookId]) versesByBook[obj.bookId] = {};
      versesByBook[obj.bookId][obj.id] = obj;
    }

    return {
      'bible-info': { data: bible },
      'bible-books': { data: books },
      'bible-chapters': chaptersByBook,
      'bible-verses': versesByBook,
    };
  }
}
