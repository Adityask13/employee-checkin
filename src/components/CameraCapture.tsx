'use client';
import { useState, useRef } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Alert
} from '@mui/material';
import { PhotoCamera, CameraAlt } from '@mui/icons-material';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose: () => void;
  open: boolean;
}

export default function CameraCapture({ onCapture, onClose, open }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [capturedImage, setCapturedImage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
    } catch (err) {
      setError('Camera access denied or not available');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
      }
    }
  };

  const confirmCapture = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      handleClose();
    }
  };

  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Capture Photo for Check-in</DialogTitle>
      <DialogContent>
        <Box sx={{ textAlign: 'center', p: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {!stream && !capturedImage && (
            <Box>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Click the button below to start your camera
              </Typography>
              <Button
                variant="contained"
                startIcon={<CameraAlt />}
                onClick={startCamera}
                size="large"
              >
                Start Camera
              </Button>
            </Box>
          )}

          {stream && !capturedImage && (
            <Box>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{ 
                  width: '100%', 
                  maxWidth: '400px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
              <br />
              <Button
                variant="contained"
                startIcon={<PhotoCamera />}
                onClick={capturePhoto}
                size="large"
              >
                Capture Photo
              </Button>
            </Box>
          )}

          {capturedImage && (
            <Box>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={capturedImage}
                alt="Captured"
                style={{ 
                  width: '100%', 
                  maxWidth: '400px', 
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}
              />
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="outlined"
                  onClick={() => setCapturedImage('')}
                >
                  Retake
                </Button>
                <Button
                  variant="contained"
                  onClick={confirmCapture}
                  color="primary"
                >
                  Confirm
                </Button>
              </Box>
            </Box>
          )}

          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
}
