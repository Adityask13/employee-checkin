'use client';
import { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Container, 
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Snackbar,
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { 
  getEmployees, 
  Employee, 
  createEmployee, 
  updateEmployee, 
  deleteEmployee 
} from '../../../api/employees';
import EmployeeDialog from '../../../components/EmployeeDialog';
import ConfirmDeleteDialog from '../../../components/ConfirmDeleteDialog';
import { isValidAdminSession, extendAdminSession } from '../../../utils/adminSession';

interface DashboardStats {
  totalEmployees: number;
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
  });
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Load employees only
      const employeesResponse = await getEmployees();

      if (employeesResponse.success) {
        setEmployees(employeesResponse.data);
        calculateStats(employeesResponse.data);
      } else {
        setError(employeesResponse.error || 'Failed to load employees');
      }
    } catch (err) {
      setError('Failed to load data');
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check authentication with session management
    const checkAuthentication = () => {
      if (isValidAdminSession()) {
        setIsAuthenticated(true);
        // Extend session on dashboard access
        extendAdminSession();
        loadData();
      } else {
        // Redirect to login if no valid session
        router.push('/admin');
      }
    };

    checkAuthentication();

    // Listen for auth changes
    const handleAuthChange = () => {
      if (!isValidAdminSession()) {
        setIsAuthenticated(false);
        router.push('/admin');
      }
    };

    window.addEventListener('adminAuthChange', handleAuthChange);

    return () => {
      window.removeEventListener('adminAuthChange', handleAuthChange);
    };
  }, [router, loadData]);

  const calculateStats = (employees: Employee[]) => {
    setStats({
      totalEmployees: employees.length,
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setEmployeeDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEmployeeDialogOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const handleSaveEmployee = async (employeeData: Omit<Employee, 'employee_id'> | Employee) => {
    setOperationLoading(true);
    try {
      if (selectedEmployee) {
        // Update existing employee
        const response = await updateEmployee(selectedEmployee.employee_id, employeeData);
        if (response.success) {
          showSnackbar('Employee updated successfully');
          loadData();
        } else {
          showSnackbar(response.error || 'Failed to update employee', 'error');
        }
      } else {
        // Create new employee
        const response = await createEmployee(employeeData as Omit<Employee, 'employee_id'>);
        if (response.success) {
          showSnackbar('Employee created successfully');
          loadData();
        } else {
          showSnackbar(response.error || 'Failed to create employee', 'error');
        }
      }
    } catch (error) {
      showSnackbar('An error occurred while saving the employee', 'error');
      console.error('Error saving employee:', error);
    } finally {
      setOperationLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedEmployee) return;
    
    setOperationLoading(true);
    try {
      const response = await deleteEmployee(selectedEmployee.employee_id);
      if (response.success) {
        showSnackbar('Employee deleted successfully');
        loadData();
      } else {
        showSnackbar(response.error || 'Failed to delete employee', 'error');
      }
    } catch (error) {
      showSnackbar('An error occurred while deleting the employee', 'error');
      console.error('Error deleting employee:', error);
    } finally {
      setOperationLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="sm" sx={{ mt: { xs: 4, sm: 8 }, px: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" textAlign="center">
          Loading...
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, textAlign: 'center', px: { xs: 2, sm: 3 } }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading dashboard data...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}>
      <Box sx={{ mb: { xs: 2, sm: 4 } }}>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
          Employee Management Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your employees with full CRUD operations
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1, sm: 2 }
          }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {error}
            </Typography>
            <Button 
              onClick={loadData} 
              size="small"
              variant="outlined"
              sx={{ 
                minWidth: { xs: '100%', sm: 'auto' },
                alignSelf: { xs: 'stretch', sm: 'auto' }
              }}
            >
              Retry
            </Button>
          </Box>
        </Alert>
      )}

      {/* Stats Cards */}
      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { 
          xs: '1fr', 
          sm: 'repeat(2, 1fr)', 
          md: 'repeat(3, 1fr)', 
          lg: 'repeat(4, 1fr)' 
        }, 
        gap: 2, 
        mb: 4 
      }}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Typography variant="h6" color="primary" gutterBottom>
              Total Employees
            </Typography>
            <Typography variant="h3" component="div" fontWeight="bold">
              {stats.totalEmployees}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Employees Management */}
      <Card>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'stretch', sm: 'center' }, 
            mb: 2,
            gap: { xs: 2, sm: 0 }
          }}>
            <Typography variant="h6">
              Employee Management ({employees.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddEmployee}
                disabled={operationLoading}
                size="small"
                sx={{ 
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { sm: '140px' }
                }}
              >
                Add Employee
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                disabled={loading}
                size="small"
                sx={{ 
                  width: { xs: '100%', sm: 'auto' },
                  minWidth: { sm: '120px' }
                }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Employee ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Email</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Department</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Phone</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.employee_id}>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="body2" fontFamily="monospace">
                        {employee.employee_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {employee.employee_first_name} {employee.employee_last_name}
                        </Typography>
                        {/* Show ID on mobile */}
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ display: { xs: 'block', sm: 'none' } }}
                        >
                          ID: {employee.employee_id}
                        </Typography>
                        {/* Show email on mobile/tablet */}
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ display: { xs: 'block', md: 'none' } }}
                        >
                          {employee.employee_email || 'No email'}
                        </Typography>
                        {/* Show phone on mobile */}
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ 
                            display: { xs: 'flex', sm: 'none' },
                            alignItems: 'center',
                            gap: 0.5,
                            mt: 0.5
                          }}
                        >
                          <PhoneIcon fontSize="inherit" />
                          {employee.employee_phone || 'No phone'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2">
                        {employee.employee_email || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <Typography variant="body2">
                        {employee.employee_department || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="body2">
                        {employee.employee_phone || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                        <Tooltip title="Edit Employee">
                          <IconButton
                            size="small"
                            onClick={() => handleEditEmployee(employee)}
                            disabled={operationLoading}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Employee">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteEmployee(employee)}
                            disabled={operationLoading}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {employees.length === 0 && (
            <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4 } }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No employees found
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddEmployee}
                sx={{ 
                  mt: 2,
                  width: { xs: '100%', sm: 'auto' },
                  maxWidth: { xs: '300px', sm: 'none' }
                }}
              >
                Add Your First Employee
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EmployeeDialog
        open={employeeDialogOpen}
        onClose={() => setEmployeeDialogOpen(false)}
        onSave={handleSaveEmployee}
        employee={selectedEmployee}
      />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        employee={selectedEmployee}
        loading={operationLoading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
