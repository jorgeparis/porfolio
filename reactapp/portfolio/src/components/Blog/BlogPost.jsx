// src/components/Blog/BlogPost.jsx
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Snackbar,
  TextField,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { blogApi } from "../../services/api";

const BlogPost = () => {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState({
    author_name: "",
    author_email: "",
    content: ""
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => blogApi.getPost(slug)
  });

  const { data: commentsData } = useQuery({
    queryKey: ["comments", data?.data?.id],
    queryFn: () => blogApi.getComments(data?.data?.id),
    enabled: !!data?.data?.id
  });

  const commentMutation = useMutation({
    mutationFn: (data) => blogApi.createComment(data.postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["comments", data?.data?.id]);
      setComment({ author_name: "", author_email: "", content: "" });
      setSnackbar({
        open: true,
        message: "Comment submitted for approval",
        severity: "success"
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: "Failed to submit comment",
        severity: "error"
      });
    }
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Typography color="error">Failed to load post</Typography>;

  const post = data.data;

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    commentMutation.mutate({ postId: post.id, ...comment });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 4 }}>
        {/* Header */}
        {post.featured_image && (
          <Box
            component="img"
            src={post.featured_image}
            alt={post.title}
            sx={{
              width: "100%",
              height: 400,
              objectFit: "cover",
              borderRadius: 2,
              mb: 3
            }}
          />
        )}

        <Box sx={{ mb: 3 }}>
          {post.tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          ))}
        </Box>

        <Typography variant="h3" component="h1" gutterBottom>
          {post.title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            By {post.author.username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date(post.created_at).toLocaleDateString()}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {post.reading_time} min read
          </Typography>
          <Typography variant="body2" color="text.secondary">
            👁️ {post.views} views
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Content */}
        <Box sx={{ "& img": { maxWidth: "100%", height: "auto" } }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Comments Section */}
        <Typography variant="h5" gutterBottom>
          Comments ({commentsData?.data?.length || 0})
        </Typography>

        <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            label="Name"
            value={comment.author_name}
            onChange={(e) =>
              setComment({ ...comment, author_name: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={comment.author_email}
            onChange={(e) =>
              setComment({ ...comment, author_email: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Comment"
            multiline
            rows={4}
            value={comment.content}
            onChange={(e) =>
              setComment({ ...comment, content: e.target.value })
            }
            margin="normal"
            required
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ mt: 2 }}
            disabled={commentMutation.isPending}
          >
            {commentMutation.isPending ? "Submitting..." : "Submit Comment"}
          </Button>
        </Box>

        <List>
          {commentsData?.data.map((comment) => (
            <ListItem key={comment.id} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar>{comment.author_name.charAt(0)}</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={comment.author_name}
                secondary={
                  <>
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {comment.content}
                    </Typography>
                    <Typography
                      variant="caption"
                      display="block"
                      color="text.secondary"
                    >
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default BlogPost;
