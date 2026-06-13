import { Router, Request, Response, NextFunction } from 'express';
import { BookService } from '../services/bookService';
import { ResponseUtils } from '../utils/responseUtils';
import { ValidationUtils } from '../utils/validationUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter, bulkLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/**
 * GET /api/v1/books/:bibleId
 * Returns all books for a bible — shaped like bible-books.json: { data: [...] }.
 */
router.get('/:bibleId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId } = req.params;
    if (!(await BookService.bibleExists(bibleId))) {
      return ResponseUtils.notFound(res, 'Bible not found');
    }

    const books = await BookService.getAllBooks(bibleId);
    ResponseUtils.success(res, books);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/books/:bibleId/:ids
 * Fetch one or more books by comma-separated IDs.
 * e.g. /api/v1/books/<bibleId>/GEN,EXO,LEV
 */
router.get('/:bibleId/:ids', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId } = req.params;
    const ids = ValidationUtils.parseStringIds(req.params.ids);
    if (ids.length === 0) {
      return ResponseUtils.badRequest(res, 'No valid book IDs provided');
    }

    const books = await BookService.getBooksByIds(bibleId, ids);
    ResponseUtils.success(res, books);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/books/:bibleId
 * Create one book (object body) or many (array body) for the given bible.
 */
router.post('/:bibleId', bulkLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId } = req.params;
    if (!(await BookService.bibleExists(bibleId))) {
      return ResponseUtils.notFound(res, 'Bible not found');
    }

    if (ValidationUtils.isBulkOperation(req.body)) {
      const { createdBooks, errors } = await BookService.createMultipleBooks(bibleId, req.body);
      return ResponseUtils.bulkResult(res, 'books', createdBooks, errors, 201);
    }

    const validationError = ValidationUtils.validateBookData(req.body);
    if (validationError) {
      return ResponseUtils.badRequest(res, validationError);
    }

    const book = await BookService.createSingleBook(bibleId, req.body);
    ResponseUtils.created(res, book);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v1/books/:bibleId
 * Update one book (object body, requires `id`) or many (array body).
 */
router.put('/:bibleId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId } = req.params;
    if (!(await BookService.bibleExists(bibleId))) {
      return ResponseUtils.notFound(res, 'Bible not found');
    }

    if (ValidationUtils.isBulkOperation(req.body)) {
      const { updateResults, errors } = await BookService.updateMultipleBooks(bibleId, req.body);
      return ResponseUtils.bulkResult(res, 'books', updateResults, errors);
    }

    if (!req.body.id) {
      return ResponseUtils.badRequest(res, 'id is required');
    }

    const book = await BookService.updateBook(bibleId, req.body.id, req.body);
    if (!book) {
      return ResponseUtils.notFound(res, 'Book not found');
    }

    ResponseUtils.success(res, book);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * DELETE /api/v1/books/:bibleId/:bookId
 * Deletes a book and cascades to its chapters and verse content.
 */
router.delete('/:bibleId/:bookId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId, bookId } = req.params;
    const result = await BookService.deleteBook(bibleId, bookId);
    if (!result) {
      return ResponseUtils.notFound(res, 'Book not found');
    }

    ResponseUtils.success(res, {
      message: 'Book deleted successfully',
      removed: result.removed,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
