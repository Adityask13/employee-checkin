'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Alert,
  Avatar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Employee } from '../api/employees';

interface EmployeeDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (employee: Employee) => Promise<void>;
  employee?: Employee | null;
}

export default function EmployeeDialog({ 
  open, 
  onClose, 
  onSave, 
  employee,
}: EmployeeDialogProps) {
  const [formData, setFormData] = useState({
    employee_first_name: '',
    employee_last_name: '',
    employee_email: '',
    employee_phone: '',
    employee_department: '',
    employee_position: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [savedEmployee, setSavedEmployee] = useState<Employee | null>(null);
  
  // Photo capture states
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [photoConfirmation, setPhotoConfirmation] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isEditing = !!employee;
  const steps = isEditing ? ['Employee Details', 'Update Photo'] : ['Employee Details'];

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_first_name: employee.employee_first_name || '',
        employee_last_name: employee.employee_last_name || '',
        employee_email: employee.employee_email || '',
        employee_phone: employee.employee_phone || '',
        employee_department: employee.employee_department || '',
        employee_position: employee.employee_position || '',
      });
    } else {
      setFormData({
        employee_first_name: '',
        employee_last_name: '',
        employee_email: '',
        employee_phone: '',
        employee_department: '',
        employee_position: '',
      });
    }
    setErrors({});
    setActiveStep(0);
    setSavedEmployee(null);
    // Reset photo states
    setShowCamera(false);
    setStream(null);
    setCapturedImage(null);
    setPhotoConfirmation(false);
    setPhotoLoading(false);
    setPhotoError('');
  }, [employee, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.employee_first_name.trim()) {
      newErrors.employee_first_name = 'First name is required';
    }

    if (!formData.employee_last_name.trim()) {
      newErrors.employee_last_name = 'Last name is required';
    }

    // Phone is required for new employees (used as employee_id)
    if (!formData.employee_phone.trim()) {
      newErrors.employee_phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]+$/.test(formData.employee_phone)) {
      newErrors.employee_phone = 'Please enter a valid phone number';
    }

    if (formData.employee_email && !/\S+@\S+\.\S+/.test(formData.employee_email)) {
      newErrors.employee_email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    if (employee) {
      // For editing, prepare the updated employee data but don't save yet
      const updatedEmployee = {
        ...employee,
        ...formData,
      };
      setSavedEmployee(updatedEmployee);
      
      // Move to photo capture step
      setActiveStep(1);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Create new employee - use phone number as employee_id
      await onSave({
        ...formData,
        employee_id: formData.employee_phone, // Set employee_id to phone number
      });
      onClose();
    } catch (error) {
      console.error('Error saving employee:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = useCallback(() => {
    // Stop camera and clean up when dialog closes
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
    setPhotoConfirmation(false);
    setPhotoLoading(false);
    setPhotoError('');
    onClose();
  }, [stream, onClose]);

  const startCamera = useCallback(async () => {
    try {
      setPhotoError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      // Use setTimeout to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current && mediaStream) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch((error) => {
                console.error('Error playing video:', error);
                setPhotoError('Failed to start video. Please try again.');
              });
            }
          };
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      setPhotoError('Camera access denied or not available. Please allow camera access and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

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

  const handleRetakePhoto = useCallback(() => {
    setCapturedImage(null);
    setPhotoConfirmation(false);
    setPhotoError('');
    startCamera();
  }, [startCamera]);

  // Auto-start camera when moving to step 2
  useEffect(() => {
    if (isEditing && activeStep === 1 && open) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startCamera();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [activeStep, isEditing, open, startCamera]);

  const handleUpdatePhoto = useCallback(async () => {
    if (!capturedImage || !savedEmployee) return;

    setPhotoLoading(true);
    setPhotoError('');

    try {
      // Step 1: Update employee data
      await onSave(savedEmployee);

      try {
        // Step 2: Upload photo to AWS S3 (only if step 1 succeeds)
        const uploadResponse = await fetch('/api/upload-photo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_base64: capturedImage.split(',')[1], // Remove data:image/jpeg;base64, prefix
            upload_key: `BARS/${savedEmployee.employee_id}.jpg`,
            bucket: "orgemployees"
          }),
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || `Photo upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        // Step 3: Update employee with photo information (only if step 2 succeeds)
        const updatedEmployeeWithPhoto = {
          ...savedEmployee,
          photo_url: `BARS/${savedEmployee.employee_id}.jpg`
        };
        await onSave(updatedEmployeeWithPhoto);

        // Step 4: Parent component's onSave will automatically call loadData() to refresh employee list
        
        // Close dialog on success
        handleClose();
      } catch (photoError) {
        console.error('Photo upload error:', photoError);
        setPhotoError(photoError instanceof Error ? photoError.message : 'Failed to upload photo. Employee data was updated successfully, but photo upload failed.');
      }
    } catch (employeeError) {
      // Step 1 failed - update employee data failed, show error message
      console.error('Employee update error:', employeeError);
      setPhotoError(employeeError instanceof Error ? employeeError.message : 'Failed to update employee data. Please try again.');
    } finally {
      setPhotoLoading(false);
    }
  }, [capturedImage, savedEmployee, onSave, handleClose]);

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {employee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        
        {/* Stepper for editing employees */}
        {isEditing && (
          <Box sx={{ px: 3, pb: 2 }}>
            <Stepper activeStep={activeStep}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}
        
        <DialogContent>
          {/* Show form only on step 0 or for new employees */}
          {(!isEditing || activeStep === 0) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="First Name"
                value={formData.employee_first_name}
                onChange={handleChange('employee_first_name')}
                error={!!errors.employee_first_name}
                helperText={errors.employee_first_name}
                required
                fullWidth
              />
              <TextField
                label="Last Name"
                value={formData.employee_last_name}
                onChange={handleChange('employee_last_name')}
                error={!!errors.employee_last_name}
                helperText={errors.employee_last_name}
                required
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={formData.employee_email}
                onChange={handleChange('employee_email')}
                error={!!errors.employee_email}
                helperText={errors.employee_email}
                fullWidth
              />
              <TextField
                label="Phone"
                value={formData.employee_phone}
                onChange={handleChange('employee_phone')}
                error={!!errors.employee_phone}
                helperText={errors.employee_phone || (employee ? '' : 'Used as Employee ID')}
                required
                fullWidth
              />
              <TextField
                label="Department"
                value={formData.employee_department}
                onChange={handleChange('employee_department')}
                fullWidth
              />
              <TextField
                label="Position"
                value={formData.employee_position}
                onChange={handleChange('employee_position')}
                fullWidth
              />
            </Box>
          )}

          {/* Show photo capture step for editing employees */}
          {isEditing && activeStep === 1 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {/* Camera loading state */}
              {!showCamera && !capturedImage && !photoLoading && !photoError && (
                <Box sx={{ py: 4 }}>
                  <CircularProgress size={48} sx={{ mb: 2 }} />
                  <Typography variant="body1">
                    Starting camera...
                  </Typography>
                </Box>
              )}

              {/* Camera view */}
              {showCamera && !photoConfirmation && (
                <Box sx={{ py: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Update Employee Photo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Position your face in the frame and click capture
                  </Typography>
                  <Box sx={{ 
                    position: 'relative', 
                    display: 'inline-block',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: 'primary.main',
                    width: '100%',
                    maxWidth: isMobile ? '100%' : '500px',
                    backgroundColor: '#000',
                    mb: 3
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
                  </Box>
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
                      Capture
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
              {photoConfirmation && capturedImage && !photoLoading && (
                <Box sx={{ py: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Update Employee Photo
                  </Typography>
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
                      Update
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleRetakePhoto}
                      startIcon={<RefreshIcon />}
                      fullWidth={isMobile}
                    >
                      Retake
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Processing state */}
              {photoLoading && (
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
              {photoError && (
                <Box sx={{ py: 2 }}>
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {photoError}
                  </Alert>
                  {!showCamera && (
                    <Button
                      variant="contained"
                      onClick={startCamera}
                      startIcon={<PhotoCameraIcon />}
                      fullWidth={isMobile}
                    >
                      Try Again
                    </Button>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          {isEditing && activeStep === 0 ? (
            <Button 
              onClick={handleNext} 
              variant="contained" 
              disabled={saving}
            >
              Next
            </Button>
          ) : !isEditing ? (
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              disabled={saving}
              startIcon={saving ? <CircularProgress size={20} /> : null}
            >
              {saving ? 'Saving...' : 'Create'}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
}
