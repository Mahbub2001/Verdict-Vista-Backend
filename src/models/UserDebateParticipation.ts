import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDebateParticipation extends Document {
  userId: mongoose.Types.ObjectId;
  debateId: mongoose.Types.ObjectId;
  side: 'support' | 'oppose';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserDebateParticipationSchema = new Schema<IUserDebateParticipation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  debateId: {
    type: Schema.Types.ObjectId,
    ref: 'Debate',
    required: [true, 'Debate ID is required']
  },
  side: {
    type: String,
    enum: ['support', 'oppose'],
    required: [true, 'Side is required']
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

UserDebateParticipationSchema.index({ userId: 1, debateId: 1 }, { unique: true });

const UserDebateParticipation = mongoose.model<IUserDebateParticipation>('UserDebateParticipation', UserDebateParticipationSchema);

export default UserDebateParticipation;
