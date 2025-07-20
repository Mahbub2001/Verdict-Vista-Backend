import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<DebateDocument, {}, {}, {}, mongoose.Document<unknown, {}, DebateDocument, {}> & DebateDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Debate.d.ts.map