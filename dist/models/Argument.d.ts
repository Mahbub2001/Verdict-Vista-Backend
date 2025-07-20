import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<ArgumentDocument, {}, {}, {}, mongoose.Document<unknown, {}, ArgumentDocument, {}> & ArgumentDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Argument.d.ts.map