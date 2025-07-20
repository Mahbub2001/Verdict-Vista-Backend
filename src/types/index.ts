export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  password?: string;
  avatarUrl: string;
  debatesParticipated: number;
  totalVotes: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Debate {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  imageUrl: string;
  creatorId: string;
  creator?: User;
  createdAt?: Date;
  updatedAt?: Date;
  duration: number; 
  endTime?: Date;
  isActive?: boolean;
}

export interface Argument {
  _id?: string;
  id?: string;
  debateId: string;
  authorId: string;
  author?: User;
  side: 'support' | 'oppose';
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
  votes: number;
  votedBy?: string[]; 
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export interface AuthRequest extends Request {
  user?: User;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface DebateFilters extends PaginationQuery {
  category?: string;
  tags?: string;
  search?: string;
  isActive?: boolean;
}
