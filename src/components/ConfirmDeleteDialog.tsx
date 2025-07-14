'use client';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { Employee } from '../api/employees';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  employee: Employee | null;
  loading?: boolean;
}

export default function ConfirmDeleteDialog({ 
  open, 
  onClose, 
  onConfirm, 
  employee,
  loading = false 
}: ConfirmDeleteDialogProps) {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Confirm Delete
      </DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" gutterBottom>
            Are you sure you want to delete this employee?
          </Typography>
          {employee && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Employee ID: {employee.employee_id}
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {employee.employee_first_name} {employee.employee_last_name}
              </Typography>
              {employee.employee_email && (
                <Typography variant="body2" color="text.secondary">
                  {employee.employee_email}
                </Typography>
              )}
              {employee.employee_department && (
                <Typography variant="body2" color="text.secondary">
                  {employee.employee_department}
                </Typography>
              )}
            </Box>
          )}
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="error"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
