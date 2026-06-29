// src/components/Blog/Login.jsx
import { Login as LoginIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
  useTheme
} from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { blogService } from "../../services/api";

const BlogLogin = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await blogService.login({
        username: formData.username,
        password: formData.password
      });

      const { access_token } = response.data;
      localStorage.setItem("blog_access_token", access_token);
      navigate("/blog/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper
        elevation={3}
        sx={{
          p: 4,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Box sx={{ textAlign: "center", mb: 3 }}>
          <LoginIcon
            sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }}
          />
          <Typography variant="h4" component="h1" gutterBottom>
            Blog Admin Login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your credentials to manage blog posts
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            value={formData.username}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value })
            }
            margin="normal"
            required
            disabled={loading}
            autoFocus
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            margin="normal"
            required
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Login"}
          </Button>
        </form>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Default credentials: admin / admin123
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 1 }}
          >
            Please change your password after first login
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default BlogLogin;
