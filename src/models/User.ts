import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '@/types';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password?: string; 
  avatarUrl: string;
  firebaseUid?: string;
  debatesParticipated: number;
  totalVotes: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: false,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  firebaseUid: {
    type: String,
    sparse: true, 
    unique: true
  },
  avatarUrl: {
    type: String,
    default: 'https://placehold.co/100x100.png'
  },
  debatesParticipated: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(_doc: any, ret: any) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    }
  }
});

userSchema.index({ email: 1 });
userSchema.index({ totalVotes: -1 });

// ----------------------------------------Hash password before saving-------------------------------------
userSchema.pre('save', async function(this: UserDocument, next: any) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ----------------------------------------------Compare password---------------------------------------
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<UserDocument>('User', userSchema);
