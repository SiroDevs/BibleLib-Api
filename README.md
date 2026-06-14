# BibleLib API (v1)

The backend API for the **BibleLib** app. It is built on the same
architecture as the SongLib v2 API (Express + Mongoose, API-key-protected
writes, rate limiting, bulk create/update, and Swagger docs), adapted for
bible content.

## Setup

```bash
npm install
cp .env.example .env   # set ATLAS_URI, API_KEY, etc.
npm run dev             # ts-node src/index.ts
```

Swagger docs are served at `/api/v1/docs` (and the raw spec at
`/api/v1/docs/spec.json`).

## Authentication

All write operations (`POST`, `PUT`, `DELETE`) require an API key:

```
x-api-key: your-secret-key
```

`GET` requests are public.

## Rate limits

| Tier | Limit | Window |
|------|-------|--------|
| Read (GET) | 300 requests | 15 min |
| Write (POST/PUT/DELETE) | 60 requests | 15 min |
| Bulk operations | 10 requests | 15 min |

## Endpoints

### Bibles — `/api/v1/bibles`

| Method | Path | Description |
|---|---|---|
| GET | `/` | List all bibles |
| GET | `/:bibleId` | Get one bible's info — `{ data: {...} }` |
| GET | `/:bibleId/export` | Export the full bundle (info + books + chapters + verses), shaped like the 4 source files |
| POST | `/` | Create one bible (object) or many (array). `id` is generated — do not send it |
| PUT | `/` | Update one bible (object with `id`) or many (array). `id` is immutable |
| DELETE | `/:bibleId` | Delete a bible — **cascades** to its books, chapters, verses |

### Books — `/api/v1/books`

| Method | Path | Description |
|---|---|---|
| GET | `/:bibleId` | All books for a bible — `{ data: [...] }` |
| GET | `/:bibleId/:ids` | Books by comma-separated ids, e.g. `GEN,EXO,LEV` |
| POST | `/:bibleId` | Create one book (object) or many (array) |
| PUT | `/:bibleId` | Update one book (object with `id`) or many (array) |
| DELETE | `/:bibleId/:bookId` | Delete a book — **cascades** to its chapters and verse content |

### Chapters — `/api/v1/chapters`

| Method | Path | Description |
|---|---|---|
| GET | `/:bibleId/:bookId` | All chapters for a book — array, matches `bible-chapters.json[bookId]` |
| GET | `/:bibleId/:bookId/:chapterId` | A single chapter |
| POST | `/:bibleId` | Create one chapter (object) or many (array) |
| PUT | `/:bibleId` | Update one chapter (object with `id`) or many (array) |
| DELETE | `/:bibleId/:chapterId` | Delete a chapter — **cascades** to its verse content |

### Verses — `/api/v1/verses`

| Method | Path | Description |
|---|---|---|
| GET | `/:bibleId/:bookId` | All verse content for a book — object keyed by chapter id, matches `bible-verses.json[bookId]` |
| GET | `/:bibleId/:bookId/:verseId` | Verse content for a single chapter, e.g. `GEN.1` |
| POST | `/:bibleId` | Create content for one chapter (object) or many (array) |
| PUT | `/:bibleId` | Update content for one chapter (object with `id`) or many (array) |
| DELETE | `/:bibleId/:verseId` | Delete a chapter's verse content |

### Health — `/api/v1/health`

`GET /` returns server + DB status.

## Example walkthrough

1. **Create the bible** (note: no `id` field — it's generated):

```bash
curl -X POST http://localhost:4000/api/v1/bibles \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '{
    "name": "New International Version 2011",
    "nameLocal": "New International Version",
    "abbreviation": "NIV11",
    "abbreviationLocal": "NIV",
    "description": "Holy Bible",
    "language": { "id": "eng", "name": "English", "scriptDirection": "LTR" },
    "countries": [{ "id": "US", "name": "United States of America" }],
    "type": "text"
  }'
# -> { "data": { "id": "78a9f6124f344018-01", "name": "New International Version 2011", ... } }
```

2. **Bulk-create books** for that bibleId:

```bash
curl -X POST http://localhost:4000/api/v1/books/78a9f6124f344018-01 \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '[
    { "id": "GEN", "abbreviation": "Ge", "name": "Gen.", "nameLong": "Genesis" },
    { "id": "EXO", "abbreviation": "Ex", "name": "Exodus", "nameLong": "Exodus" }
  ]'
```

3. **Bulk-create chapters** for Genesis:

```bash
curl -X POST http://localhost:4000/api/v1/chapters/78a9f6124f344018-01 \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '[
    { "id": "GEN.1", "bookId": "GEN", "number": "1", "reference": "Gen. 1" },
    { "id": "GEN.2", "bookId": "GEN", "number": "2", "reference": "Gen. 2" }
  ]'
```

4. **Bulk-create verse content** (one entry per chapter, with the full content tree):

```bash
curl -X POST http://localhost:4000/api/v1/verses/78a9f6124f344018-01 \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-key" \
  -d '[
    {
      "id": "GEN.1",
      "bookId": "GEN",
      "number": "1",
      "reference": "Gen. 1",
      "verseCount": 31,
      "content": [ ... ]
    }
  ]'
```

5. **Fetch everything back** in the original file shapes:

```bash
curl http://localhost:4000/api/v1/bibles/78a9f6124f344018-01
curl http://localhost:4000/api/v1/books/78a9f6124f344018-01
curl http://localhost:4000/api/v1/chapters/78a9f6124f344018-01/GEN
curl http://localhost:4000/api/v1/verses/78a9f6124f344018-01/GEN

# or get all four at once:
curl http://localhost:4000/api/v1/bibles/78a9f6124f344018-01/export
```

## Importing an existing bible directory

If you have a directory laid out like `minimal.zip`
(`bible-info.json`, `bible-books.json`, `bible-chapters.json`,
`bible-verses.json`), use the included script to import it in one go:

```bash
node scripts/import-bible.js ./minimal http://localhost:4000/api/v1 your-secret-key
```

It creates the bible (capturing the generated `bibleId`), then bulk-creates
the books, chapters, and verse content from those files.

## Data model summary

- **Bible** — one document per bible, `_id` = generated `bibleId`. Holds
  `name`, `abbreviation`, `language`, `countries`, `copyright`, `info`, etc.
- **Book** — `{ id, bibleId, abbreviation, name, nameLong }`, unique on
  `(bibleId, id)`.
- **Chapter** — `{ id, bibleId, bookId, number, reference }`, unique on
  `(bibleId, id)`.
- **Verse** — `{ id, bibleId, bookId, number, reference, copyright,
  verseCount, content }`, unique on `(bibleId, id)`. `content` is the
  USX-like tree of paragraphs/verses/text exactly as found in
  `bible-verses.json`.

Deleting a bible cascades to its books, chapters, and verses. Deleting a
book cascades to its chapters and verses. Deleting a chapter cascades to its
verse content.
