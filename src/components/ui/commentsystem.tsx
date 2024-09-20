'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/app/authcontext'
import { db } from '@/lib/firebaseConfig'
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp, DocumentData, collectionGroup } from 'firebase/firestore'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from 'react-hot-toast'
import { getDoc, doc, setDoc } from 'firebase/firestore'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Comment {
  id: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: Timestamp;
  parentId?: string;
  replies?: Comment[];
}

const CommentSystem: React.FC<{ novelId: string }> = ({ novelId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    console.log('CommentSystem mounted. Novel ID:', novelId);
    
    // Create a reference to the novel document
    const novelRef = doc(db, 'novels', novelId);
    
    // Create a query for the comments subcollection
    const commentsQuery = query(
      collection(novelRef, 'comments'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
      console.log('Snapshot received. Document count:', snapshot.docs.length);
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Comment));
      console.log('Fetched comments:', fetchedComments);
      
      // Organize comments into a tree structure
      const commentTree = fetchedComments.filter(comment => !comment.parentId);
      const replyMap = fetchedComments.filter(comment => comment.parentId).reduce((map, comment) => {
        if (!map[comment.parentId!]) {
          map[comment.parentId!] = [];
        }
        map[comment.parentId!].push(comment);
        return map;
      }, {} as Record<string, Comment[]>);

      const addRepliesToComment = (comment: Comment) => {
        comment.replies = replyMap[comment.id] || [];
        comment.replies.forEach(addRepliesToComment);
      };

      commentTree.forEach(addRepliesToComment);
      setComments(commentTree);
    }, (error) => {
      console.error("Error fetching comments:", error);
    });

    return () => unsubscribe();
  }, [novelId]);

  const handleSubmitComment = async (e: React.FormEvent, parentId?: string) => {
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

      const novelRef = doc(db, 'novels', novelId);
      const commentsRef = collection(novelRef, 'comments');

      await addDoc(commentsRef, {
        text: newComment,
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        userAvatar: userAvatar,
        createdAt: Timestamp.now(),
        parentId: parentId || null
      });

      // Update the comment count in the novel document
      await setDoc(novelRef, { commentCount: (comments.length + 1) }, { merge: true });

      setNewComment('');
      setReplyingTo(null);
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`flex flex-col space-y-2 mb-4 ${depth > 0 ? 'ml-8' : ''}`}>
      <div className="flex items-start space-x-4">
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
          <div className="flex space-x-4">
            <Button 
              variant="link" 
              onClick={() => setReplyingTo(comment.id)}
              className="p-0 h-auto text-sm text-blue-500"
            >
              Reply
            </Button>
            {comment.replies && comment.replies.length > 0 && (
              <Button
                variant="link"
                onClick={() => toggleReplies(comment.id)}
                className="p-0 h-auto text-sm text-blue-500 flex items-center"
              >
                {expandedComments.has(comment.id) ? (
                  <>
                    Hide Replies
                    <ChevronUp className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Show Replies ({comment.replies.length})
                    <ChevronDown className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
      {replyingTo === comment.id && (
        <form onSubmit={(e) => handleSubmitComment(e, comment.id)} className="flex gap-2 ml-14">
          <Input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a reply..."
            className="flex-grow"
          />
          <Button type="submit">Reply</Button>
        </form>
      )}
      {expandedComments.has(comment.id) && comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  console.log('Rendering comments. Count:', comments.length);

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => handleSubmitComment(e)} className="flex gap-2">
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
          comments.map(comment => renderComment(comment))
        ) : (
          <p>No comments yet. Be the first to comment!</p>
        )}
      </div>
    </div>
  );
}

export default CommentSystem;