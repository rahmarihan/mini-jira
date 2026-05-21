import api from '../../lib/axios';
import { Comment } from '../types/comment';

export const commentService = {
  async getComments(taskId: string): Promise<Comment[]> {
    const res = await api.get(`/tasks/${taskId}/comments`);
    return res.data;
  },

  async createComment(taskId: string, content: string): Promise<Comment> {
    const res = await api.post(`/tasks/${taskId}/comments`, { content });
    return res.data;
  },
};