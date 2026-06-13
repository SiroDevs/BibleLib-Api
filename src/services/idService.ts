import crypto from 'crypto';
import { Bible } from '../models';

export interface BibleIdSeed {
  name: string;
  abbreviation: string;
  language?: { id?: string };
}

/**
 * Generates BibleLib's own bibleIds.
 *
 * The upstream format looks like `78a9f6124f344018-01`: a 16-character hex
 * string, a dash, and a 2-digit version suffix. We reproduce that shape so
 * the rest of the data (books/chapters/verses, which all carry a `bibleId`
 * field) plugs in without any changes.
 *
 * The hex portion is derived deterministically from the user's input
 * (name + abbreviation + language), so the same submission always produces
 * the same base id. The `-NN` suffix is incremented if that base id is
 * already taken — e.g. two different "King James Version, English" bibles
 * would get `...-01` and `...-02`.
 */
export class IdService {
  static async generateBibleId(seed: BibleIdSeed): Promise<string> {
    const base = crypto
      .createHash('md5')
      .update(`${seed.name}|${seed.abbreviation}|${seed.language?.id || ''}`)
      .digest('hex')
      .slice(0, 16);

    for (let suffix = 1; suffix <= 99; suffix++) {
      const candidate = `${base}-${String(suffix).padStart(2, '0')}`;
      const exists = await Bible.exists({ _id: candidate });
      if (!exists) {
        return candidate;
      }
    }

    // Extremely unlikely fallback: fold in a random salt to free up a slot.
    const salted = crypto
      .createHash('md5')
      .update(`${seed.name}|${seed.abbreviation}|${seed.language?.id || ''}|${Date.now()}`)
      .digest('hex')
      .slice(0, 16);

    return `${salted}-01`;
  }
}
