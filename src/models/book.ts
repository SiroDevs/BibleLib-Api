import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
  id: string;        // e.g. "GEN" — user-supplied canonical book code
  bibleId: string;   // FK -> Bible._id
  abbreviation?: string;
  name: string;
  nameLong?: string;
  created: Date;
  updated?: Date;
}

const bookSchema = new Schema<IBook>({
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
  abbreviation: {
    type: String,
    trim: true,
  },
  name: {
    type: String,
    required: [true, 'name is required'],
    trim: true,
  },
  nameLong: {
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

// A book id is unique within a given bible, but the same book code (e.g. "GEN")
// is reused across different bibles.
bookSchema.index({ bibleId: 1, id: 1 }, { unique: true });

bookSchema.pre<IBook>('save', function (next) {
  this.updated = new Date();
  next();
});

export const Book = mongoose.model<IBook>('Book', bookSchema);
export default Book;
