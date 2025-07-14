'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Avatar,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab
} from '@mui/material';
import { 
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Videocam as VideocamIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';

interface EmployeePhotoCaptureProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  onEmployeeUpdate?: (employeeData: Record<string, unknown>) => Promise<void>;
}

export default function EmployeePhotoCapture({ 
  open, 
  onClose, 
  onSuccess, 
  employeeId, 
  onEmployeeUpdate 
}: EmployeePhotoCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoConfirmation, setPhotoConfirmation] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 for camera, 1 for upload
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      setError('');
      
      // Use setTimeout to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch((error) => {
                console.error('Error playing video:', error);
                setError('Failed to start video. Please try again.');
              });
            }
          };
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available. Please allow camera access and try again.');
    }
  }, []);

  // Auto-start camera when dialog opens and camera tab is selected
  useEffect(() => {
    if (open && !capturedImage && !loading && activeTab === 0) {
      startCamera();
    }
  }, [open, capturedImage, loading, activeTab, startCamera]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  const handleClose = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
    setError('');
    setLoading(false);
    setPhotoConfirmation(false);
    setActiveTab(0);
    onClose();
  }, [stream, onClose]);

  const uploadPhoto = useCallback(async (base64Data: string) => {
    try {
      setLoading(true);
      setError('');

      // First, upload photo to AWS S3 through our proxy
      const uploadResponse = await fetch('/api/upload-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Data.split(',')[1], // Remove data:image/jpeg;base64, prefix
          upload_key: `BARS/${employeeId}.jpg`,
          bucket: "orgemployees"
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Photo upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
      }

      const uploadData = await uploadResponse.json();
      console.log('Photo upload successful:', uploadData);

      // If there's an employee update callback, call it
      if (onEmployeeUpdate) {
        await onEmployeeUpdate({
          photo_url: `BARS/${employeeId}.jpg` // Update employee record with photo URL
        });
      }
      
      // Call success callback and close
      onSuccess();
      handleClose();
    } catch (err) {
      console.error('Photo upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [employeeId, onSuccess, handleClose, onEmployeeUpdate]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions
    canvas.width = 640;
    canvas.height = 480;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const base64Data = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop camera
    stopCamera();
    
    // Set captured image and show confirmation
    setCapturedImage(base64Data);
    setPhotoConfirmation(true);
  }, [stopCamera]);

  const handleUpdatePhoto = useCallback(async () => {
    if (capturedImage) {
      setPhotoConfirmation(false);
      await uploadPhoto(capturedImage);
    }
  }, [capturedImage, uploadPhoto]);

  const handleRetakePhoto = useCallback(() => {
    setCapturedImage(null);
    setPhotoConfirmation(false);
    setError('');
    if (activeTab === 0) {
      startCamera();
    }
  }, [startCamera, activeTab]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      setCapturedImage(base64Data);
      setPhotoConfirmation(true);
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleTabChange = useCallback((newTab: number) => {
    setActiveTab(newTab);
    setError('');
    setCapturedImage(null);
    setPhotoConfirmation(false);
    
    if (newTab === 0 && !showCamera) {
      startCamera();
    } else if (newTab === 1) {
      stopCamera();
    }
  }, [startCamera, stopCamera, showCamera]);

  return (
    <>
      <Dialog 
        open={open} 
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            minHeight: isMobile ? '100vh' : '600px',
            margin: isMobile ? 0 : 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="h5" component="div">
            Update Employee Photo
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Employee ID: {employeeId}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
          {/* Tab selector */}
          {!photoConfirmation && !loading && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={activeTab} onChange={(_, newValue) => handleTabChange(newValue)} centered>
                <Tab 
                  label="Camera" 
                  icon={<VideocamIcon />} 
                  iconPosition="start"
                />
                <Tab 
                  label="Upload" 
                  icon={<CloudUploadIcon />} 
                  iconPosition="start"
                />
              </Tabs>
            </Box>
          )}

          {/* Camera Tab Content */}
          {activeTab === 0 && !photoConfirmation && !loading && (
            <>
              {/* Camera loading state */}
              {!showCamera && !error && (
                <Box sx={{ py: 4 }}>
                  <CircularProgress size={48} sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    Starting camera...
                  </Typography>
                </Box>
              )}

              {/* Camera view */}
              {showCamera && (
                <Box sx={{ py: 2 }}>
                  <Box sx={{ 
                    position: 'relative', 
                    display: 'inline-block',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '500px',
                    backgroundColor: '#000'
                  }}>
                    <video
                      ref={videoRef}
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        backgroundColor: '#000',
                        aspectRatio: '4/3'
                      }}
                      playsInline
                      muted
                      autoPlay
                    />
                    {!stream && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        color: 'white'
                      }}>
                        <CircularProgress size={24} sx={{ color: 'white', mr: 1 }} />
                        <Typography variant="body2" component="span">
                          Loading camera...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ mt: 2, mb: 3 }}>
                    Position your face in the frame and click capture
                  </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 2, 
                    justifyContent: 'center',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: 'center'
                  }}>
                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<PhotoCameraIcon />}
                      onClick={capturePhoto}
                      disabled={!stream}
                      fullWidth={isMobile}
                    >
                      Capture Photo
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleClose}
                      fullWidth={isMobile}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </>
          )}

          {/* Upload Tab Content */}
          {activeTab === 1 && !photoConfirmation && !loading && (
            <Box sx={{ py: 4 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <CloudUploadIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Upload Photo
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Select an image file from your device (max 5MB)
              </Typography>
              <Button
                variant="contained"
                size="large"
                startIcon={<CloudUploadIcon />}
                onClick={() => fileInputRef.current?.click()}
                fullWidth={isMobile}
              >
                Choose File
              </Button>
            </Box>
          )}

          {/* Photo confirmation view */}
          {photoConfirmation && capturedImage && !loading && (
            <Box sx={{ py: 2 }}>
              <Avatar
                src={capturedImage}
                alt="Captured"
                sx={{ 
                  width: isMobile ? 150 : 200, 
                  height: isMobile ? 150 : 200, 
                  margin: '0 auto', 
                  mb: 2 
                }}
              />
              <Typography variant="h6" gutterBottom>
                Update employee photo?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review the photo and choose to update or retake
              </Typography>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                justifyContent: 'center',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center'
              }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpdatePhoto}
                  startIcon={<CheckCircleIcon />}
                  fullWidth={isMobile}
                >
                  Update Photo
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleRetakePhoto}
                  startIcon={<PhotoCameraIcon />}
                  fullWidth={isMobile}
                >
                  Retake
                </Button>
              </Box>
            </Box>
          )}

          {/* Processing state */}
          {loading && (
            <Box sx={{ py: 2 }}>
              {capturedImage && (
                <Avatar
                  src={capturedImage}
                  alt="Captured"
                  sx={{ 
                    width: isMobile ? 150 : 200, 
                    height: isMobile ? 150 : 200, 
                    margin: '0 auto', 
                    mb: 2 
                  }}
                />
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body1">
                  Uploading photo...
                </Typography>
              </Box>
            </Box>
          )}

          {/* Error state */}
          {error && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              {!showCamera && activeTab === 0 && (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Button
                    variant="contained"
                    onClick={startCamera}
                    startIcon={<VideocamIcon />}
                    fullWidth={isMobile}
                  >
                    Try Again
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}
