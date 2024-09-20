'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/app/authcontext'
import { db } from '@/lib/firebaseConfig'
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, DocumentData } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from 'react-hot-toast'
import { getDoc, doc } from 'firebase/firestore'

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Timestamp;
}

const CommentSystem: React.FC<{ novelId: string }> = ({ novelId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    console.log('CommentSystem mounted. Novel ID:', novelId);
    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('novelId', '==', novelId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot received. Document count:', snapshot.docs.length);
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      console.log('Fetched comments:', fetchedComments);
      setComments(fetchedComments);
    }, (error) => {
      console.error("Error fetching comments:", error);
    });

    return () => unsubscribe();
  }, [novelId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be logged in to comment');
      return;
    }
    if (!newComment.trim()) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const userAvatar = userData?.profilePicture || '';

      await addDoc(collection(db, 'comments'), {
        novelId,
        text: newComment,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: userAvatar,
        createdAt: Timestamp.now()
      });
      setNewComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  console.log('Rendering comments. Count:', comments.length);

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmitComment} className="flex gap-2">
        <Input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-grow"
        />
        <Button type="submit">Post</Button>
      </form>
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start space-x-4">
              <Avatar className="w-10 h-10">
                <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                <AvatarFallback>{comment.userName[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className="font-semibold">{comment.userName}</p>
                <p>{comment.text}</p>
                <p className="text-sm text-gray-500">
                  {comment.createdAt.toDate().toLocaleString()}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p>No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}

export default CommentSystem;