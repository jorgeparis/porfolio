// src/components/Blog/BlogList.jsx
import { Add, Login } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Container,
  Grid,
  MenuItem,
  Pagination,
  TextField,
  Typography,
  useTheme
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { blogService } from "../../services/api";

const BlogList = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [search, setSearch] = useState("");
  const limit = 9;

  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem("blog_access_token");

  const { data, isLoading, error } = useQuery({
    queryKey: ["blog-posts", page, category, tag, search],
    queryFn: () =>
      blogService.getPosts({
        skip: (page - 1) * limit,
        limit,
        category: category || undefined,
        tag: tag || undefined,
        search: search || undefined
      }),
    retry: 1
  });

  const handleLogout = () => {
    localStorage.removeItem("blog_access_token");
    navigate("/blog");
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">
          Failed to load blog posts. Please make sure the blog backend is
          running on port 8001.
        </Alert>
      </Container>
    );
  }

  const posts = data?.data?.posts || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Blog Header with Admin Controls */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4
        }}
      >
        <Typography
          variant="h3"
          component="h1"
          sx={{
            fontWeight: 700,
            color: theme.palette.text.primary
          }}
        >
          Blog
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          {isLoggedIn ? (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Add />}
                onClick={() => navigate("/blog/admin")}
              >
                New Post
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              startIcon={<Login />}
              onClick={() => navigate("/blog/login")}
            >
              Admin Login
            </Button>
          )}
        </Box>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search posts"
              variant="outlined"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: theme.palette.background.paper
                }
              }}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: theme.palette.background.paper
                }
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="technology">Technology</MenuItem>
              <MenuItem value="design">Design</MenuItem>
              <MenuItem value="business">Business</MenuItem>
              <MenuItem value="lifestyle">Lifestyle</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              fullWidth
              label="Tag"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g., react"
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: theme.palette.background.paper
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Posts Grid */}
      {posts.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No posts found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isLoggedIn
              ? 'Click "New Post" to create your first blog post!'
              : "Login as admin to create your first blog post."}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {posts.map((post) => (
              <Grid item xs={12} md={6} lg={4} key={post.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: theme.shadows[8]
                    },
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  {post.featured_image && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={post.featured_image}
                      alt={post.title}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ mb: 1 }}>
                      {post.tags.slice(0, 3).map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {post.tags.length > 3 && (
                        <Chip
                          label={`+${post.tags.length - 3}`}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      )}
                    </Box>
                    <Typography
                      variant="h6"
                      component="h2"
                      gutterBottom
                      sx={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        fontWeight: 600
                      }}
                    >
                      <Link
                        to={`/blog/${post.slug}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        {post.title}
                      </Link>
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}
                    >
                      {post.summary || post.content.substring(0, 150) + "..."}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {new Date(post.created_at).toLocaleDateString()} ·{" "}
                        {post.reading_time} min read
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        👁️ {post.views}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {pages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
              <Pagination
                count={pages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                sx={{
                  "& .MuiPaginationItem-root": {
                    color: theme.palette.text.primary
                  }
                }}
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default BlogList;
