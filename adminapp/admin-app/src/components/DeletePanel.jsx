import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Image as ImageIcon,
  Folder as FolderIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import axios from "axios";

const StyledCard = styled(Card)(({ theme }) => ({
  height: "100%",
  display: "flex",
  flexDirection: "column",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: theme.shadows[8],
  },
}));

const ImageWrapper = styled(Box)({
  position: "relative",
  paddingTop: "75%",
  overflow: "hidden",
});

const StyledCardMedia = styled(CardMedia)({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
});

const DeleteBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 8,
  right: 8,
  zIndex: 1,
}));

const DeletePanel = ({
  selectedFiles,
  setSelectedFiles,
  activeIndex,
  setActiveIndex,
  title,
  category,
  country,
}) => {
  // State
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIds, setSelectedImageIds] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterCountry, setFilterCountry] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [deleteProgress, setDeleteProgress] = useState(0);

  // Load images on component mount
  useEffect(() => {
    fetchImages();
  }, []);

  // Fetch all images
  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("/api/upload/images", {
        params: { limit: 100 },
      });
      setImages(response.data.images || []);
    } catch (err) {
      setError("Failed to load images. Please try again.");
      console.error("Error fetching images:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle single image delete
  const handleDeleteClick = (image) => {
    setImageToDelete(image);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSingle = async () => {
    try {
      setDeleting(true);
      await axios.delete(`/api/upload/images/${imageToDelete.id}`);
      
      // Remove from state
      setImages(images.filter(img => img.id !== imageToDelete.id));
      setSelectedImageIds(selectedImageIds.filter(id => id !== imageToDelete.id));
      
      showSnackbar(`Image "${imageToDelete.title || imageToDelete.original_filename}" deleted successfully`, "success");
    } catch (err) {
      showSnackbar("Failed to delete image. Please try again.", "error");
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setImageToDelete(null);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedImageIds.length === 0) {
      showSnackbar("Please select images to delete", "warning");
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      setDeleting(true);
      setDeleteProgress(0);
      
      // Simulate progress for better UX
      const total = selectedImageIds.length;
      let completed = 0;
      
      const response = await axios.delete("/api/upload/bulk-delete", {
        params: { image_ids: selectedImageIds },
        onDownloadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDeleteProgress(percentCompleted);
        },
      });
      
      // Remove deleted images from state
      setImages(images.filter(img => !selectedImageIds.includes(img.id)));
      const deletedCount = selectedImageIds.length;
      setSelectedImageIds([]);
      
      showSnackbar(
        `Successfully deleted ${response.data.deleted_count || deletedCount} images`,
        "success"
      );
    } catch (err) {
      showSnackbar("Failed to delete selected images. Please try again.", "error");
      console.error("Bulk delete error:", err);
    } finally {
      setDeleting(false);
      setBulkDeleteDialogOpen(false);
      setDeleteProgress(0);
    }
  };

  // Handle select/deselect image
  const toggleImageSelection = (imageId) => {
    setSelectedImageIds(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedImageIds.length === filteredImages.length) {
      setSelectedImageIds([]);
    } else {
      setSelectedImageIds(filteredImages.map(img => img.id));
    }
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Filter and sort images
  const filteredImages = images
    .filter(img => {
      const matchesSearch = 
        img.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.original_filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.country?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === "all" || img.category === filterCategory;
      const matchesCountry = filterCountry === "all" || img.country === filterCountry;
      
      return matchesSearch && matchesCategory && matchesCountry;
    })
    .sort((a, b) => {
      const dateA = new Date(a.uploaded_at);
      const dateB = new Date(b.uploaded_at);
      if (sortBy === "newest") return dateB - dateA;
      if (sortBy === "oldest") return dateA - dateB;
      if (sortBy === "size") return (b.file_size || 0) - (a.file_size || 0);
      if (sortBy === "name") return (a.title || a.original_filename).localeCompare(b.title || b.original_filename);
      return 0;
    });

  // Get unique categories and countries for filters
  const categories = [...new Set(images.map(img => img.category).filter(Boolean))];
  const countries = [...new Set(images.map(img => img.country).filter(Boolean))];

  // Stats
  const totalImages = images.length;
  const selectedCount = selectedImageIds.length;

  // Loading state
  if (loading) {
    return (
      <Box sx={{ p: 3, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Box textAlign="center">
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>
            Loading images...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: "100%" }}>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5" component="h2">
              Manage Images
            </Typography>
            <Chip
              label={`${totalImages} images`}
              color="primary"
              size="small"
            />
            {selectedCount > 0 && (
              <Chip
                label={`${selectedCount} selected`}
                color="secondary"
                size="small"
              />
            )}
          </Box>

          <Box display="flex" gap={1} flexWrap="wrap">
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchImages}
              size="small"
            >
              Refresh
            </Button>

            {selectedCount > 0 && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteSweepIcon />}
                onClick={handleBulkDelete}
                size="small"
                disabled={deleting}
              >
                Delete Selected ({selectedCount})
              </Button>
            )}

            <Button
              variant="outlined"
              onClick={handleSelectAll}
              size="small"
              disabled={filteredImages.length === 0}
            >
              {selectedCount === filteredImages.length && filteredImages.length > 0
                ? "Deselect All"
                : "Select All"}
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box display="flex" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
          <TextField
            size="small"
            placeholder="Search images..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 200, flex: 1 }}
          />

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(cat => (
                <MenuItem key={cat} value={cat}>{cat}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Country</InputLabel>
            <Select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              label="Country"
            >
              <MenuItem value="all">All Countries</MenuItem>
              {countries.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
            >
              <MenuItem value="newest">Newest First</MenuItem>
              <MenuItem value="oldest">Oldest First</MenuItem>
              <MenuItem value="size">Largest First</MenuItem>
              <MenuItem value="name">Name A-Z</MenuItem>
            </Select>
          </FormControl>

          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(e, value) => value && setViewMode(value)}
          >
            <ToggleButton value="grid">Grid</ToggleButton>
            <ToggleButton value="list">List</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button size="small" onClick={fetchImages} sx={{ ml: 2 }}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Empty State */}
      {filteredImages.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          {searchTerm || filterCategory !== "all" || filterCountry !== "all" ? (
            <>
              <FilterListIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No images match your filters
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Try adjusting your search or filter criteria
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {
                  setSearchTerm("");
                  setFilterCategory("all");
                  setFilterCountry("all");
                }}
                sx={{ mt: 2 }}
              >
                Clear Filters
              </Button>
            </>
          ) : (
            <>
              <ImageIcon sx={{ fontSize: 48, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No images uploaded yet
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Upload images from the Upload tab
              </Typography>
            </>
          )}
        </Paper>
      )}

      {/* Image Grid */}
      {filteredImages.length > 0 && (
        <Grid container spacing={2}>
          {filteredImages.map((image) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
              <StyledCard>
                <ImageWrapper>
                  <StyledCardMedia
                    component="img"
                    image={`/uploads/${image.filename}`}
                    alt={image.title || image.original_filename}
                    onError={(e) => {
                      e.target.src = "/placeholder-image.jpg";
                    }}
                  />
                  
                  <DeleteBadge>
                    <Checkbox
                      checked={selectedImageIds.includes(image.id)}
                      onChange={() => toggleImageSelection(image.id)}
                      sx={{
                        backgroundColor: "rgba(255,255,255,0.9)",
                        borderRadius: 1,
                        "&:hover": {
                          backgroundColor: "rgba(255,255,255,1)",
                        },
                      }}
                    />
                  </DeleteBadge>

                  {image.is_primary && (
                    <Chip
                      label="Primary"
                      color="primary"
                      size="small"
                      sx={{
                        position: "absolute",
                        bottom: 8,
                        left: 8,
                        zIndex: 1,
                      }}
                    />
                  )}
                </ImageWrapper>

                <CardContent sx={{ flexGrow: 1, p: 1.5 }}>
                  <Typography variant="subtitle2" noWrap>
                    {image.title || image.original_filename}
                  </Typography>
                  
                  <Box display="flex" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }}>
                    {image.category && (
                      <Chip label={image.category} size="small" variant="outlined" />
                    )}
                    {image.country && (
                      <Chip label={image.country} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Box display="flex" gap={1} sx={{ mt: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      {formatFileSize(image.file_size)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      •
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {formatDate(image.uploaded_at)}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: "flex-end", p: 1 }}>
                  <Tooltip title="Delete image">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(image)}
                      disabled={deleting}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </StyledCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Progress */}
      {deleting && deleteProgress > 0 && deleteProgress < 100 && (
        <Box sx={{ width: "100%", mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Deleting images... {deleteProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={deleteProgress} />
        </Box>
      )}

      {/* Delete Confirmation Dialog - Single */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Image</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the image "
            {imageToDelete?.title || imageToDelete?.original_filename}"?
            This action cannot be undone.
          </DialogContentText>
          {imageToDelete && (
            <Box sx={{ mt: 2, bgcolor: "grey.50", p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="textSecondary">
                <strong>File:</strong> {imageToDelete.original_filename}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                <strong>Size:</strong> {formatFileSize(imageToDelete.file_size)}
              </Typography>
              {imageToDelete.category && (
                <Typography variant="body2" color="textSecondary">
                  <strong>Category:</strong> {imageToDelete.category}
                </Typography>
              )}
              {imageToDelete.country && (
                <Typography variant="body2" color="textSecondary">
                  <strong>Country:</strong> {imageToDelete.country}
                </Typography>
              )}
              <Typography variant="body2" color="textSecondary">
                <strong>Uploaded:</strong> {formatDate(imageToDelete.uploaded_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={confirmDeleteSingle}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={() => setBulkDeleteDialogOpen(false)}>
        <DialogTitle>Bulk Delete Images</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selectedImageIds.length} selected images?
            This action cannot be undone.
          </DialogContentText>
          {selectedImageIds.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Images to delete:
              </Typography>
              <Box sx={{ maxHeight: 200, overflow: "auto", mt: 1 }}>
                {images
                  .filter(img => selectedImageIds.includes(img.id))
                  .slice(0, 10)
                  .map(img => (
                    <Typography key={img.id} variant="body2">
                      • {img.title || img.original_filename}
                    </Typography>
                  ))}
                {selectedImageIds.length > 10 && (
                  <Typography variant="body2" color="textSecondary">
                    ... and {selectedImageIds.length - 10} more
                  </Typography>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            onClick={confirmBulkDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteSweepIcon />}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : `Delete ${selectedImageIds.length} Images`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          icon={snackbar.severity === "success" ? <CheckCircleIcon /> : <ErrorIcon />}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeletePanel;