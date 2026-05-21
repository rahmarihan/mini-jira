'use client';

import { useEffect, useState } from 'react';
import { commentService } from '../../services/comment.service';
import { Comment } from '../../types/comment';

type Props = {
  taskId: string;
};

export default function CommentThread({ taskId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadComments = async () => {
    const data = await commentService.getComments(taskId);
    setComments(data);
  };

  useEffect(() => {
    if (taskId) loadComments();
  }, [taskId]);

  const handleAddComment = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      const newComment = await commentService.createComment(taskId, content);
      setComments((prev) => [...prev, newComment]);
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      <h3>Comments</h3>

      <div style={{ marginBottom: '1rem' }}>
        {comments.length === 0 ? (
          <p>No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.commentId}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.5rem',
              }}
            >
              <strong>{comment.userName || comment.userEmail}</strong>
              <p>{comment.content}</p>
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>

      <textarea
        placeholder="Write a comment..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{
          width: '100%',
          minHeight: '80px',
          padding: '0.5rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      />

      <button
        onClick={handleAddComment}
        disabled={loading}
        style={{
          marginTop: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
        }}
      >
        {loading ? 'Adding...' : 'Add Comment'}
      </button>
    </div>
  );
}