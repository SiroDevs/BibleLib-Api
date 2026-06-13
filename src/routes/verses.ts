import { Router, Request, Response, NextFunction } from 'express';
import { VerseService } from '../services/verseService';
import { ResponseUtils } from '../utils/responseUtils';
import { ValidationUtils } from '../utils/validationUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter, bulkLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/**
 * GET /api/v1/verses/:bibleId/:bookId
 * Returns all verse content for a book — shaped like
 * bible-verses.json[bookId]: { "<chapterId>": { ... } }.
 */
router.get('/:bibleId/:bookId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId, bookId } = req.params;
    const verses = await VerseService.getVersesByBook(bibleId, bookId);
    ResponseUtils.success(res, verses);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/verses/:bibleId/:bookId/:verseId
 * Returns the verse content for a single chapter, e.g.
 * /api/v1/verses/<bibleId>/GEN/GEN.1
 */
router.get('/:bibleId/:bookId/:verseId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId, verseId } = req.params;
    const verse = await VerseService.getVerseById(bibleId, verseId);
    if (!verse) {
      return ResponseUtils.notFound(res, 'Verse content not found');
    }
    ResponseUtils.success(res, verse);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/verses/:bibleId
 * Create verse content for one chapter (object body) or many (array body).
 */
router.post('/:bibleId', bulkLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId } = req.params;

    if (ValidationUtils.isBulkOperation(req.body)) {
      const { createdVerses, errors } = await VerseService.createMultipleVerses(bibleId, req.body);
      return ResponseUtils.bulkResult(res, 'verses', createdVerses, errors, 201);
    }

    const validationError = ValidationUtils.validateVerseData(req.body);
    if (validationError) {
      return ResponseUtils.badRequest(res, validationError);
    }

    const verse = await VerseService.createSingleVerse(bibleId, req.body);
    ResponseUtils.created(res, verse);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v1/verses/:bibleId
 * Update verse content for one chapter (object body, requires `id`) or many (array body).
 */
router.put('/:bibleId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId } = req.params;

    if (ValidationUtils.isBulkOperation(req.body)) {
      const { updateResults, errors } = await VerseService.updateMultipleVerses(bibleId, req.body);
      return ResponseUtils.bulkResult(res, 'verses', updateResults, errors);
    }

    if (!req.body.id) {
      return ResponseUtils.badRequest(res, 'id is required');
    }

    const verse = await VerseService.updateVerse(bibleId, req.body.id, req.body);
    if (!verse) {
      return ResponseUtils.notFound(res, 'Verse content not found');
    }

    ResponseUtils.success(res, verse);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * DELETE /api/v1/verses/:bibleId/:verseId
 * Deletes the verse content for a single chapter, e.g.
 * /api/v1/verses/<bibleId>/GEN.1
 */
router.delete('/:bibleId/:verseId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId, verseId } = req.params;
    const result = await VerseService.deleteVerse(bibleId, verseId);
    if (result.deletedCount === 0) {
      return ResponseUtils.notFound(res, 'Verse content not found');
    }

    ResponseUtils.success(res, { message: 'Verse content deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
