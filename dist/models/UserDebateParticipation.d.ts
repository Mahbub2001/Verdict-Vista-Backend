import mongoose, { Document } from 'mongoose';
export interface IUserDebateParticipation extends Document {
    userId: mongoose.Types.ObjectId;
    debateId: mongoose.Types.ObjectId;
    side: 'support' | 'oppose';
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const UserDebateParticipation: mongoose.Model<IUserDebateParticipation, {}, {}, {}, mongoose.Document<unknown, {}, IUserDebateParticipation, {}> & IUserDebateParticipation & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default UserDebateParticipation;
//# sourceMappingURL=UserDebateParticipation.d.ts.map