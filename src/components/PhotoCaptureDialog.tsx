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
  useTheme
} from '@mui/material';
import { 
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Videocam as VideocamIcon
} from '@mui/icons-material';

interface PhotoCaptureDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (result: FaceRecognitionResult) => void;
}

interface FaceRecognitionResult {
  employee_id: string;
  similarity: number;
  sqs_message_id: string;
}

interface FaceRecognitionResponse {
  employee_id: string;
  similarity: number;
  sqs_message_id: string;
}

export default function PhotoCaptureDialog({ open, onClose, onSuccess }: PhotoCaptureDialogProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<FaceRecognitionResult | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photoConfirmation, setPhotoConfirmation] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
      
      console.log('Media stream obtained:', mediaStream);
      console.log('Video tracks:', mediaStream.getVideoTracks());
      
      setStream(mediaStream);
      setShowCamera(true);
      setError('');
      
      // Use setTimeout to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          console.log('Setting video source...');
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded');
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log('Video playing successfully');
              }).catch((error) => {
                console.error('Error playing video:', error);
                setError('Failed to start video. Please try again.');
              });
            }
          };
        } else {
          console.error('Video ref not available or stream is null');
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setError('Camera access denied or not available. Please allow camera access and try again.');
    }
  }, []);

  // Auto-start camera when dialog opens
  useEffect(() => {
    if (open && !capturedImage && !loading && !result) {
      startCamera();
    }
  }, [open, capturedImage, loading, result, startCamera]);

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
    setResult(null);
    setLoading(false);
    setPhotoConfirmation(false);
    onClose();
  }, [stream, onClose]);

  const processImage = useCallback(async (base64Data: string) => {
    try {
      setLoading(true);
      setError('');

      // Call face recognition API through our proxy
      const response = await fetch('/api/face-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64Data.split(',')[1] // Remove data:image/jpeg;base64, prefix
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const data: FaceRecognitionResponse = await response.json();
      
      if (data.employee_id) {
        setResult(data);
        
        // Immediately call success callback and let parent handle closing
        onSuccess(data);
        
        // Clean up and close after showing success message briefly
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError('No face recognized. Please try again.');
      }
    } catch (err) {
      console.error('Face recognition error:', err);
      setError(err instanceof Error ? err.message : 'Failed to recognize face. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [onSuccess, handleClose]);

  const capturePhoto = useCallback(async () => {
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

  const handleUsePhoto = useCallback(async () => {
    if (capturedImage) {
      // Stop camera immediately when user decides to use photo
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      setShowCamera(false);
      setPhotoConfirmation(false);
      await processImage(capturedImage);
    }
  }, [capturedImage, processImage, stream]);

  const handleRetakePhoto = useCallback(() => {
    setCapturedImage(null);
    setPhotoConfirmation(false);
    setError('');
    setResult(null);
    startCamera();
  }, [startCamera]);

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
            Employee Check-in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Position your face in front of the camera and capture your photo
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ textAlign: 'center', p: isMobile ? 2 : 3 }}>
          {/* Camera loading state */}
          {!showCamera && !capturedImage && !loading && !result && !error && (
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

          {/* Photo confirmation view */}
          {photoConfirmation && capturedImage && !loading && !result && (
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
                Use this photo?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Review your photo and choose to use it or retake a new one
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
                  onClick={handleUsePhoto}
                  startIcon={<CheckCircleIcon />}
                  fullWidth={isMobile}
                >
                  Use Photo
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
          {capturedImage && loading && (
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <CircularProgress size={24} sx={{ mr: 1 }} />
                <Typography variant="body1">
                  Recognizing face...
                </Typography>
              </Box>
            </Box>
          )}

          {/* Success state */}
          {result && (
            <Box sx={{ py: 2 }}>
              {capturedImage && (
                <Avatar
                  src={capturedImage}
                  alt="Captured"
                  sx={{ 
                    width: isMobile ? 120 : 150, 
                    height: isMobile ? 120 : 150, 
                    margin: '0 auto', 
                    mb: 2 
                  }}
                />
              )}
              <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" color="success.main" gutterBottom>
                Check-in Successful!
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Employee ID: <strong>{result.employee_id}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Similarity: {result.similarity.toFixed(1)}%
              </Typography>
            </Box>
          )}

          {/* Error state */}
          {error && (
            <>
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
              {!showCamera && (
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
