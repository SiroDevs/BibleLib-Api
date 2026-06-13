import { Router, Request, Response, NextFunction } from 'express';
import { ChapterService } from '../services/chapterService';
import { ResponseUtils } from '../utils/responseUtils';
import { ValidationUtils } from '../utils/validationUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter, bulkLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/**
 * GET /api/v1/chapters/:bibleId/:bookId
 * Returns all chapters for a book — shaped like bible-chapters.json[bookId]: [...].
 */
router.get('/:bibleId/:bookId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId, bookId } = req.params;
    const chapters = await ChapterService.getChaptersByBook(bibleId, bookId);
    ResponseUtils.success(res, chapters);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/chapters/:bibleId/:bookId/:chapterId
 * Returns a single chapter, e.g. /api/v1/chapters/<bibleId>/GEN/GEN.1
 */
router.get('/:bibleId/:bookId/:chapterId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId, chapterId } = req.params;
    const chapter = await ChapterService.getChapterById(bibleId, chapterId);
    if (!chapter) {
      return ResponseUtils.notFound(res, 'Chapter not found');
    }
    ResponseUtils.success(res, chapter);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/chapters/:bibleId
 * Create one chapter (object body) or many (array body) for the given bible.
 */
router.post('/:bibleId', bulkLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId } = req.params;

    if (ValidationUtils.isBulkOperation(req.body)) {
      const { createdChapters, errors } = await ChapterService.createMultipleChapters(bibleId, req.body);
      return ResponseUtils.bulkResult(res, 'chapters', createdChapters, errors, 201);
    }

    const validationError = ValidationUtils.validateChapterData(req.body);
    if (validationError) {
      return ResponseUtils.badRequest(res, validationError);
    }

    const chapter = await ChapterService.createSingleChapter(bibleId, req.body);
    ResponseUtils.created(res, chapter);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v1/chapters/:bibleId
 * Update one chapter (object body, requires `id`) or many (array body).
 */
router.put('/:bibleId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId } = req.params;

    if (ValidationUtils.isBulkOperation(req.body)) {
      const { updateResults, errors } = await ChapterService.updateMultipleChapters(bibleId, req.body);
      return ResponseUtils.bulkResult(res, 'chapters', updateResults, errors);
    }

    if (!req.body.id) {
      return ResponseUtils.badRequest(res, 'id is required');
    }

    const chapter = await ChapterService.updateChapter(bibleId, req.body.id, req.body);
    if (!chapter) {
      return ResponseUtils.notFound(res, 'Chapter not found');
    }

    ResponseUtils.success(res, chapter);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * DELETE /api/v1/chapters/:bibleId/:chapterId
 * Deletes a chapter and its associated verse content.
 * e.g. /api/v1/chapters/<bibleId>/GEN.1
 */
router.delete('/:bibleId/:chapterId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { bibleId, chapterId } = req.params;
    const result = await ChapterService.deleteChapter(bibleId, chapterId);
    if (!result) {
      return ResponseUtils.notFound(res, 'Chapter not found');
    }

    ResponseUtils.success(res, {
      message: 'Chapter deleted successfully',
      removed: result.removed,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
