import mongoose, { Schema, Document } from 'mongoose';

export interface IVerse extends Document {
  id: string;          // e.g. "GEN.1" — chapter id whose verse content this is
  bibleId: string;     // FK -> Bible._id
  bookId: string;      // e.g. "GEN"
  number: string;      // chapter number, e.g. "1"
  reference?: string;
  copyright?: string;
  verseCount?: number;
  content: any[];      // USX-like content tree (tags, text items, etc.)
  created: Date;
  updated?: Date;
}

const verseSchema = new Schema<IVerse>({
  id: {
    type: String,
    required: [true, 'id is required'],
    trim: true,
  },
  bibleId: {
    type: String,
    required: [true, 'bibleId is required'],
    trim: true,
    index: true,
  },
  bookId: {
    type: String,
    required: [true, 'bookId is required'],
    trim: true,
    index: true,
  },
  number: {
    type: String,
    required: [true, 'number is required'],
    trim: true,
  },
  reference: {
    type: String,
    trim: true,
  },
  copyright: {
    type: String,
    trim: true,
  },
  verseCount: {
    type: Number,
    default: 0,
    min: [0, 'verseCount cannot be negative'],
  },
  content: {
    type: [Schema.Types.Mixed],
    default: [],
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
  },
});

verseSchema.index({ bibleId: 1, id: 1 }, { unique: true });
verseSchema.index({ bibleId: 1, bookId: 1 });

verseSchema.pre<IVerse>('save', function (next) {
  this.updated = new Date();
  next();
});

export const Verse = mongoose.model<IVerse>('Verse', verseSchema);
export default Verse;
