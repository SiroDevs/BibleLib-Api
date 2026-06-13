import mongoose, { Schema, Document } from 'mongoose';

export interface IChapter extends Document {
  id: string;        // e.g. "GEN.1"
  bibleId: string;   // FK -> Bible._id
  bookId: string;    // e.g. "GEN"
  number: string;
  reference?: string;
  created: Date;
  updated?: Date;
}

const chapterSchema = new Schema<IChapter>({
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
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
  },
});

chapterSchema.index({ bibleId: 1, id: 1 }, { unique: true });

chapterSchema.pre<IChapter>('save', function (next) {
  this.updated = new Date();
  next();
});

export const Chapter = mongoose.model<IChapter>('Chapter', chapterSchema);
export default Chapter;
