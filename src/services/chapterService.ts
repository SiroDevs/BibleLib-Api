import { Chapter, Verse } from '../models';

export class ChapterService {
  /**
   * Returns all chapters for a book, shaped like bible-chapters.json[bookId]: [...].
   */
  static async getChaptersByBook(bibleId: string, bookId: string) {
    const chapters = await Chapter.find({ bibleId, bookId }).select(
      '-_id -__v -created -updated'
    );
    return chapters.map((c) => c.toObject());
  }

  static async getChapterById(bibleId: string, chapterId: string) {
    return await Chapter.findOne({ bibleId, id: chapterId }).select('-_id -__v -created -updated');
  }

  static async createSingleChapter(bibleId: string, chapterData: any) {
    const { bibleId: _omit, ...rest } = chapterData;
    return await Chapter.create({ ...rest, bibleId });
  }

  static async createMultipleChapters(bibleId: string, chaptersData: any[]) {
    const createdChapters: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of chaptersData.entries()) {
      try {
        if (!item.id) {
          errors.push({ index, error: 'id is required' });
          continue;
        }
        if (!item.bookId) {
          errors.push({ index, error: 'bookId is required' });
          continue;
        }
        if (!item.number) {
          errors.push({ index, error: 'number is required' });
          continue;
        }
        const chapter = await this.createSingleChapter(bibleId, item);
        createdChapters.push(chapter);
      } catch (error: any) {
        errors.push({
          index,
          error: error.code === 11000 ? 'Duplicate record' : 'Creation failed',
          details: error.message,
        });
      }
    }

    return { createdChapters, errors };
  }

  static async updateChapter(bibleId: string, chapterId: string, updateData: any) {
    const { id: _id, bibleId: _bid, ...safeData } = updateData;
    safeData.updated = new Date();

    return await Chapter.findOneAndUpdate({ bibleId, id: chapterId }, safeData, {
      new: true,
      runValidators: true,
    });
  }

  static async updateMultipleChapters(bibleId: string, chaptersData: any[]) {
    const updateResults: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of chaptersData.entries()) {
      try {
        if (!item.id) {
          errors.push({ index, error: 'id is required' });
          continue;
        }
        const chapter = await this.updateChapter(bibleId, item.id, item);
        if (!chapter) {
          errors.push({ index, id: item.id, error: 'Chapter not found' });
          continue;
        }
        updateResults.push(chapter);
      } catch (error: any) {
        errors.push({
          index,
          id: item.id,
          error: error.code === 11000 ? 'Duplicate record' : 'Update failed',
          details: error.message,
        });
      }
    }

    return { updateResults, errors };
  }

  /**
   * Deletes a chapter. Also removes the corresponding verse content document
   * (they share the same `id`, e.g. "GEN.1").
   */
  static async deleteChapter(bibleId: string, chapterId: string) {
    const chapter = await Chapter.findOneAndDelete({ bibleId, id: chapterId });
    if (!chapter) return null;

    const verseResult = await Verse.deleteOne({ bibleId, id: chapterId });

    return {
      chapter,
      removed: {
        verses: verseResult.deletedCount || 0,
      },
    };
  }
}
