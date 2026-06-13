import { Bible, Book, Chapter, Verse } from '../models';

export class BookService {
  static async bibleExists(bibleId: string): Promise<boolean> {
    return !!(await Bible.exists({ _id: bibleId }));
  }

  /**
   * Returns all books for a bible, shaped like bible-books.json: { data: [...] }.
   */
  static async getAllBooks(bibleId: string) {
    const books = await Book.find({ bibleId }).select('-_id -__v -bibleId -created -updated');
    return { data: books.map((b) => ({ ...b.toObject(), bibleId })) };
  }

  static async getBooksByIds(bibleId: string, bookIds: string[]) {
    const books = await Book.find({ bibleId, id: { $in: bookIds } }).select(
      '-_id -__v -bibleId -created -updated'
    );
    return { data: books.map((b) => ({ ...b.toObject(), bibleId })) };
  }

  static async createSingleBook(bibleId: string, bookData: any) {
    const { bibleId: _omit, ...rest } = bookData;
    return await Book.create({ ...rest, bibleId });
  }

  static async createMultipleBooks(bibleId: string, booksData: any[]) {
    const createdBooks: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of booksData.entries()) {
      try {
        if (!item.id) {
          errors.push({ index, error: 'id is required' });
          continue;
        }
        if (!item.name) {
          errors.push({ index, error: 'name is required' });
          continue;
        }
        const book = await this.createSingleBook(bibleId, item);
        createdBooks.push(book);
      } catch (error: any) {
        errors.push({
          index,
          error: error.code === 11000 ? 'Duplicate record' : 'Creation failed',
          details: error.message,
        });
      }
    }

    return { createdBooks, errors };
  }

  static async updateBook(bibleId: string, bookId: string, updateData: any) {
    // Strip id/bibleId from the payload to prevent accidental identity changes
    const { id: _id, bibleId: _bid, ...safeData } = updateData;
    safeData.updated = new Date();

    return await Book.findOneAndUpdate({ bibleId, id: bookId }, safeData, {
      new: true,
      runValidators: true,
    });
  }

  static async updateMultipleBooks(bibleId: string, booksData: any[]) {
    const updateResults: any[] = [];
    const errors: any[] = [];

    for (const [index, item] of booksData.entries()) {
      try {
        if (!item.id) {
          errors.push({ index, error: 'id is required' });
          continue;
        }
        const book = await this.updateBook(bibleId, item.id, item);
        if (!book) {
          errors.push({ index, id: item.id, error: 'Book not found' });
          continue;
        }
        updateResults.push(book);
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
   * Deletes a book and cascades the delete to its chapters and verse content.
   */
  static async deleteBook(bibleId: string, bookId: string) {
    const book = await Book.findOneAndDelete({ bibleId, id: bookId });
    if (!book) return null;

    const [chapters, verses] = await Promise.all([
      Chapter.deleteMany({ bibleId, bookId }),
      Verse.deleteMany({ bibleId, bookId }),
    ]);

    return {
      book,
      removed: {
        chapters: chapters.deletedCount || 0,
        verses: verses.deletedCount || 0,
      },
    };
  }
}
