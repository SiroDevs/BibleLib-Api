import { Verse } from '../models';

export class VerseService {
  /**
   * Returns all verse content for a book, shaped like
   * bible-verses.json[bookId]: { "<chapterId>": { ... } }.
   */
  static async getVersesByBook(bibleId: string, bookId: string) {
    const verses = await Verse.find({ bibleId, bookId }).select('-_id -__v -created -updated');

    const result: Record<string, any> = {};
    for (const verse of verses) {
      const obj = verse.toObject();
      result[obj.id] = obj;
    }
    return result;
  }

  static async getVerseById(bibleId: string, verseId: string) {
    return await Verse.findOne({ bibleId, id: verseId }).select('-_id -__v -created -updated');
  }

  static async createSingleVerse(bibleId: string, verseData: any) {
    const { bibleId: _omit, ...rest } = verseData;
    return await Verse.create({ ...rest, bibleId });
  }

  static async createMultipleVerses(bibleId: string, versesData: any[]) {
    const createdVerses: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of versesData.entries()) {
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
        const verse = await this.createSingleVerse(bibleId, item);
        createdVerses.push(verse);
      } catch (error: any) {
        errors.push({
          index,
          error: error.code === 11000 ? 'Duplicate record' : 'Creation failed',
          details: error.message,
        });
      }
    }

    return { createdVerses, errors };
  }

  static async updateVerse(bibleId: string, verseId: string, updateData: any) {
    const { id: _id, bibleId: _bid, ...safeData } = updateData;
    safeData.updated = new Date();

    return await Verse.findOneAndUpdate({ bibleId, id: verseId }, safeData, {
      new: true,
      runValidators: true,
    });
  }

  static async updateMultipleVerses(bibleId: string, versesData: any[]) {
    const updateResults: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of versesData.entries()) {
      try {
        if (!item.id) {
          errors.push({ index, error: 'id is required' });
          continue;
        }
        const verse = await this.updateVerse(bibleId, item.id, item);
        if (!verse) {
          errors.push({ index, id: item.id, error: 'Verse content not found' });
          continue;
        }
        updateResults.push(verse);
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

  static async deleteVerse(bibleId: string, verseId: string) {
    return await Verse.deleteOne({ bibleId, id: verseId });
  }
}
