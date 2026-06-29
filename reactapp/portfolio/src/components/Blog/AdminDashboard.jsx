// src/components/Blog/AdminDashboard.jsx
import { Delete, Edit, Visibility } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { blogService } from "../../services/api";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    summary: "",
    category: "",
    tags: "",
    status: "draft"
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Check if user is logged in
  const token = localStorage.getItem("blog_access_token");

  useEffect(() => {
    if (!token) {
      navigate("/blog/login");
    }
  }, [token, navigate]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: () => blogService.getPosts({ status: "all", limit: 100 }),
    retry: 1,
    enabled: !!token // Only run query if token exists
  });

  // Log the data for debugging
  console.log("Admin posts data:", data);
  console.log("Admin posts error:", error);

  const createMutation = useMutation({
    mutationFn: blogService.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-posts"]);
      setOpenDialog(false);
      resetForm();
      setSnackbar({
        open: true,
        message: "Post created successfully",
        severity: "success"
      });
      refetch();
    },
    onError: (error) => {
      console.error("Create error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Failed to create post",
        severity: "error"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => blogService.updatePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-posts"]);
      setOpenDialog(false);
      resetForm();
      setSnackbar({
        open: true,
        message: "Post updated successfully",
        severity: "success"
      });
      refetch();
    },
    onError: (error) => {
      console.error("Update error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Failed to update post",
        severity: "error"
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: blogService.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-posts"]);
      setSnackbar({
        open: true,
        message: "Post deleted successfully",
        severity: "success"
      });
      refetch();
    },
    onError: (error) => {
      console.error("Delete error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.detail || "Failed to delete post",
        severity: "error"
      });
    }
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      summary: "",
      category: "",
      tags: "",
      status: "draft"
    });
    setEditingPost(null);
  };

  const handleOpenDialog = (post = null) => {
    if (post) {
      setEditingPost(post);
      setFormData({
        title: post.title,
        content: post.content,
        summary: post.summary || "",
        category: post.category || "",
        tags: post.tags.join(", "),
        status: post.status
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleSubmit = () => {
    const tags = formData.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const data = { ...formData, tags };
    delete data.tags;

    if (editingPost) {
      updateMutation.mutate({ id: editingPost.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("blog_access_token");
    navigate("/blog/login");
  };

  // If not logged in, show nothing (will redirect via useEffect)
  if (!token) {
    return null;
  }

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get posts from the response
  const posts = data?.data?.posts || data?.posts || [];
  console.log("Posts array:", posts);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Typography variant="h4">Blog Management</Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button variant="contained" onClick={() => handleOpenDialog()}>
            Create New Post
          </Button>
          <Button variant="outlined" color="error" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Error loading posts: {error.message}
        </Alert>
      )}

      {posts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            No posts yet! 📝
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click "Create New Post" to write your first blog post.
          </Typography>
          <Button
            variant="contained"
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Create Your First Post
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Views</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>
                    <Link
                      to={`/blog/${post.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      {post.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={post.status}
                      color={
                        post.status === "published"
                          ? "success"
                          : post.status === "draft"
                          ? "warning"
                          : "default"
                      }
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{post.category || "-"}</TableCell>
                  <TableCell>
                    {post.tags &&
                      post.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ mr: 0.5 }}
                        />
                      ))}
                  </TableCell>
                  <TableCell>{post.views || 0}</TableCell>
                  <TableCell>
                    {new Date(post.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      component={Link}
                      to={`/blog/${post.slug}`}
                      size="small"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      onClick={() => handleOpenDialog(post)}
                      size="small"
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(post.id)}
                      size="small"
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingPost ? "Edit Post" : "Create New Post"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Summary"
            value={formData.summary}
            onChange={(e) =>
              setFormData({ ...formData, summary: e.target.value })
            }
            margin="normal"
            multiline
            rows={2}
          />
          <TextField
            fullWidth
            label="Content (Markdown supported)"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            margin="normal"
            multiline
            rows={6}
            required
          />
          <TextField
            fullWidth
            label="Category"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            margin="normal"
            placeholder="react, javascript, webdev"
          />
          <TextField
            fullWidth
            select
            label="Status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            margin="normal"
          >
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="archived">Archived</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? "Saving..."
              : editingPost
              ? "Update"
              : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

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

export default AdminDashboard;
