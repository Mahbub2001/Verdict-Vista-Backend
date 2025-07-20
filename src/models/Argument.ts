import mongoose, { Schema, Document } from 'mongoose';
import { Argument } from '@/types';

export interface ArgumentDocument extends Document {
  debateId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  side: 'support' | 'oppose';
  text: string;
  upvotes: number;
  downvotes: number;
  upvotedBy?: mongoose.Types.ObjectId[];
  downvotedBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const argumentSchema = new Schema<ArgumentDocument>({
  debateId: {
    type: Schema.Types.ObjectId,
    ref: 'Debate',
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  side: {
    type: String,
    enum: ['support', 'oppose'],
    required: [true, 'Side is required']
  },
  text: {
    type: String,
    required: [true, 'Argument text is required'],
    trim: true,
    minlength: [10, 'Argument must be at least 10 characters'],
    maxlength: [1000, 'Argument cannot be more than 1000 characters']
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  upvotedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

argumentSchema.index({ debateId: 1 });
argumentSchema.index({ authorId: 1 });
argumentSchema.index({ side: 1 });
argumentSchema.index({ upvotes: -1 });
argumentSchema.index({ downvotes: -1 });
argumentSchema.index({ createdAt: -1 });
argumentSchema.index({ debateId: 1, side: 1 });

argumentSchema.index({ _id: 1, upvotedBy: 1 });
argumentSchema.index({ _id: 1, downvotedBy: 1 });

export default mongoose.model<ArgumentDocument>('Argument', argumentSchema);
