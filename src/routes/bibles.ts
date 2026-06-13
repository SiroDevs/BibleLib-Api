import { Router, Request, Response, NextFunction } from 'express';
import { BibleService } from '../services/bibleService';
import { ResponseUtils } from '../utils/responseUtils';
import { ValidationUtils } from '../utils/validationUtils';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter, bulkLimiter } from '../middleware/rateLimit';

const router = Router();

router.use(requireApiKey);

/**
 * GET /api/v1/bibles
 * Returns all bibles.
 */
router.get('/', readLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const bibles = await BibleService.getAllBibles();
    ResponseUtils.success(res, { data: bibles });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/bibles/:bibleId/export
 * Returns the full bible bundle (info, books, chapters, verses) shaped
 * exactly like the four bible-*.json source files.
 */
router.get('/:bibleId/export', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bundle = await BibleService.exportBible(req.params.bibleId);
    if (!bundle) {
      return ResponseUtils.notFound(res, 'Bible not found');
    }
    ResponseUtils.success(res, bundle);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/bibles/:bibleId
 * Returns a single bible's info — shaped like bible-info.json: { data: {...} }.
 */
router.get('/:bibleId', readLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bible = await BibleService.getBibleById(req.params.bibleId);
    if (!bible) {
      return ResponseUtils.notFound(res, 'Bible not found');
    }
    ResponseUtils.success(res, bible);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/bibles
 * Create one bible (object body) or many (array body).
 * BibleLib generates the bibleId from name + abbreviation + language.
 */
router.post('/', bulkLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (ValidationUtils.isBulkOperation(req.body)) {
      const { createdBibles, errors } = await BibleService.createMultipleBibles(req.body);
      return ResponseUtils.bulkResult(res, 'bibles', createdBibles, errors, 201);
    }

    const validationError = ValidationUtils.validateBibleData(req.body);
    if (validationError) {
      return ResponseUtils.badRequest(res, validationError);
    }

    const bible = await BibleService.createSingleBible(req.body);
    ResponseUtils.created(res, bible);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * PUT /api/v1/bibles
 * Update one bible (object body, requires `id`) or many (array body).
 * The bibleId itself is immutable.
 */
router.put('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (ValidationUtils.isBulkOperation(req.body)) {
      const { updateResults, errors } = await BibleService.updateMultipleBibles(req.body);
      return ResponseUtils.bulkResult(res, 'bibles', updateResults, errors);
    }

    const bibleId = req.body.id || req.body.bibleId || req.body._id;
    if (!bibleId) {
      return ResponseUtils.badRequest(res, 'id (bibleId) is required');
    }

    const result = await BibleService.updateBible(bibleId, req.body);
    if (!result) {
      return ResponseUtils.notFound(res, 'Bible not found');
    }

    ResponseUtils.success(res, result);
  } catch (error: any) {
    if (error.code === 11000) {
      return ResponseUtils.conflict(res, 'Duplicate record');
    }
    next(error);
  }
});

/**
 * DELETE /api/v1/bibles/:bibleId
 * Deletes a bible and cascades to its books, chapters and verses.
 */
router.delete('/:bibleId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await BibleService.deleteBible(req.params.bibleId);
    if (!result) {
      return ResponseUtils.notFound(res, 'Bible not found');
    }

    ResponseUtils.success(res, {
      message: 'Bible deleted successfully',
      removed: result.removed,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
