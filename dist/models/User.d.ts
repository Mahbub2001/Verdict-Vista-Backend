import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<UserDocument, {}, {}, {}, mongoose.Document<unknown, {}, UserDocument, {}> & UserDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map