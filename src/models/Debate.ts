import mongoose, { Schema, Document } from 'mongoose';
import { Debate } from '@/types';

export interface DebateDocument extends Document {
  title: string;
  description: string;
  tags: string[];
  category: string;
  imageUrl: string;
  creatorId: mongoose.Types.ObjectId;
  duration: number;
  endTime: Date;
  isActive: boolean;
  supportUsers: mongoose.Types.ObjectId[];
  opposeUsers: mongoose.Types.ObjectId[];
  isExpired(): boolean;
}

const debateSchema = new Schema<DebateDocument>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Technology', 'Politics', 'Science', 'Social', 'Economics', 'Environment', 'Sports', 'Entertainment', 'Other'],
    default: 'Other'
  },
  imageUrl: {
    type: String,
    default: 'https://placehold.co/600x400.png'
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [3600, 'Duration must be at least 1 hour (3600 seconds)'],
    max: [604800, 'Duration cannot be more than 1 week (604800 seconds)'],
    default: 86400 // 24 hours
  },
  endTime: {
    type: Date,
    required: false 
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supportUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  opposeUsers: [{
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

debateSchema.index({ creatorId: 1 });
debateSchema.index({ category: 1 });
debateSchema.index({ tags: 1 });
debateSchema.index({ createdAt: -1 });
debateSchema.index({ endTime: 1 });
debateSchema.index({ isActive: 1 });
debateSchema.index({ title: 'text', description: 'text' }); 

debateSchema.pre('save', function(this: DebateDocument, next: any) {
  if (this.isNew || !this.endTime) {
    this.endTime = new Date(Date.now() + this.duration * 1000);
  }
  next();
});

// ------------------------------check if debate is expired-------------------------------
debateSchema.methods.isExpired = function(): boolean {
  return new Date() > this.endTime;
};

// --------------------------------check debate is active and not expired----------------------
debateSchema.virtual('isActiveAndNotExpired').get(function(this: DebateDocument) {
  return this.isActive && !this.isExpired();
});

export default mongoose.model<DebateDocument>('Debate', debateSchema);
