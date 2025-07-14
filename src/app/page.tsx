'use client';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Container, 
  Typography,
  Chip,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  CameraAlt as CameraIcon,
  Upload as UploadIcon,
  PersonPin as PersonIcon,
  Fingerprint as FingerprintIcon
} from '@mui/icons-material';
import { useState } from 'react';
import PhotoCaptureDialog from '../components/PhotoCaptureDialog';
import FileUpload from '../components/FileUpload';

interface FaceRecognitionResult {
  employee_id: string;
  similarity: number;
  sqs_message_id: string;
}

export default function Home() {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleCheckIn = () => {
    setSuccessMessage(''); // Clear previous success message
    setCameraOpen(true);
  };

  const handleFaceRecognitionSuccess = (result: FaceRecognitionResult) => {
    // Handle successful face recognition
    if (process.env.NODE_ENV === 'development') {
      console.log('Face recognition result:', result);
    }
    
    setSuccessMessage(`Welcome! Employee ${result.employee_id} checked in successfully (${result.similarity.toFixed(1)}% match)`);
    setCameraOpen(false);
  };

  const handleUpload = async (imageData: string) => {
    try {
      // Convert uploaded image to base64 and send to face recognition API
      const response = await fetch('/api/face-recognition', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageData.split(',')[1] // Remove data:image/jpeg;base64, prefix
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status} ${response.statusText}`);
      }

      const result: FaceRecognitionResult = await response.json();
      
      if (result.employee_id) {
        setSuccessMessage(`Welcome! Employee ${result.employee_id} checked in successfully via upload (${result.similarity.toFixed(1)}% match)`);
      } else {
        setSnackbarMessage('No face recognized in uploaded image. Please try again.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Face recognition error:', error);
      setSnackbarMessage(error instanceof Error ? error.message : 'Failed to recognize face in uploaded image.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
    
    setUploadOpen(false);
  };

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        mt: isMobile ? 2 : 4, 
        px: isMobile ? 2 : 3,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box sx={{ textAlign: 'center', mb: isMobile ? 3 : 4 }}>
        {/* Hero Icon */}
        <Box sx={{ mb: 2 }}>
          <PersonIcon 
            sx={{ 
              fontSize: isMobile ? 64 : 80, 
              color: 'primary.main',
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
            }} 
          />
        </Box>
        
        <Typography 
          variant={isMobile ? "h4" : "h3"} 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 600,
            background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Employee Check-in
        </Typography>
        <Typography 
          variant={isMobile ? "body1" : "h6"} 
          color="text.secondary"
          sx={{ 
            px: isMobile ? 1 : 0,
            lineHeight: 1.4
          }}
        >
          Position your face in front of the camera and click capture to check in
        </Typography>
      </Box>

      {/* Development mode indicator */}
      {isDevelopment && (
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Chip 
            label="Upload Picture enabled in Development Mode" 
            color="info" 
            variant="outlined" 
            size={isMobile ? "small" : "medium"}
            icon={<FingerprintIcon />}
            sx={{
              fontSize: isMobile ? '0.75rem' : '0.875rem',
              px: 1
            }}
          />
        </Box>
      )}

      <Card
        sx={{
          borderRadius: isMobile ? 2 : 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid',
          borderColor: 'divider',
          background: 'linear-gradient(135deg, #ffffff 0%, #f5f5f5 100%)'
        }}
      >
        <CardContent sx={{ 
          textAlign: 'center', 
          p: isMobile ? 3 : 4,
          '&:last-child': { pb: isMobile ? 3 : 4 }
        }}>
          {/* Camera Icon above buttons */}
          <Box sx={{ mb: 3 }}>
            <CameraIcon 
              sx={{ 
                fontSize: isMobile ? 48 : 64, 
                color: 'primary.main',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }} 
            />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            justifyContent: 'center', 
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            mb: 0
          }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCheckIn}
              size={isMobile ? "medium" : "large"}
              startIcon={<CameraIcon />}
              fullWidth={isMobile}
              sx={{
                py: isMobile ? 1.5 : 2,
                px: isMobile ? 2 : 3,
                fontSize: isMobile ? '1rem' : '1.1rem',
                fontWeight: 600,
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Check In
            </Button>
            
            {/* Upload button - Only show in development mode */}
            {isDevelopment && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setSuccessMessage(''); // Clear previous success message
                  setUploadOpen(true);
                }}
                size={isMobile ? "medium" : "large"}
                startIcon={<UploadIcon />}
                fullWidth={isMobile}
                sx={{
                  py: isMobile ? 1.5 : 2,
                  px: isMobile ? 2 : 3,
                  fontSize: isMobile ? '1rem' : '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  borderWidth: 2,
                  '&:hover': {
                    borderWidth: 2,
                    transform: 'translateY(-1px)'
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Upload Photo
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Success Message */}
      {successMessage && (
        <Box sx={{ mt: 3, mb: 2 }}>
          <Alert 
            severity="success" 
            variant="filled" 
            sx={{ 
              textAlign: 'center',
              borderRadius: 2,
              fontSize: isMobile ? '0.9rem' : '1rem',
              py: isMobile ? 1 : 1.5,
              '& .MuiAlert-icon': {
                fontSize: isMobile ? '1.2rem' : '1.5rem'
              }
            }}
          >
            {successMessage}
          </Alert>
        </Box>
      )}

      {/* Photo Capture Dialog */}
      <PhotoCaptureDialog
        open={cameraOpen}
        onSuccess={handleFaceRecognitionSuccess}
        onClose={() => setCameraOpen(false)}
      />

      {/* File Upload Dialog - Only render in development */}
      {isDevelopment && (
        <FileUpload
          open={uploadOpen}
          onUpload={handleUpload}
          onClose={() => setUploadOpen(false)}
        />
      )}

      {/* Error Snackbar (Success messages now shown below card) */}
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ 
          vertical: 'top', 
          horizontal: 'center' 
        }}
        sx={{
          mt: isMobile ? 1 : 2,
          '& .MuiSnackbarContent-root': {
            fontSize: isMobile ? '0.875rem' : '1rem'
          }
        }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{
            fontSize: isMobile ? '0.875rem' : '1rem',
            '& .MuiAlert-icon': {
              fontSize: isMobile ? '1.2rem' : '1.5rem'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
