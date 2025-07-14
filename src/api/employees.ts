// API configuration
const AWS_API_URL = 'https://0uq172mu3k.execute-api.us-east-2.amazonaws.com/default/EmployeeLambdaHandler';
const PROXY_API_URL = '/api/employees';

// Use proxy in development to avoid CORS issues
const API_BASE_URL = process.env.NODE_ENV === 'development' ? PROXY_API_URL : AWS_API_URL;

// Employee interface based on your API response
export interface Employee {
  employee_id: string;
  employee_first_name: string;
  employee_last_name: string;
  employee_email?: string;
  employee_phone?: string;
  employee_department?: string;
  employee_position?: string;
  created_at?: string;
  updated_at?: string;
}

// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// Get all employees
export const getEmployees = async (): Promise<ApiResponse<Employee[]>> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if(data?.employees) {
      return {
        success: true,
        data: data.employees,
      };
    }
    // Fallback if the response structure is different
    return {
      success: true,
      data: Array.isArray(data) ? data : [data],
    };
  } catch (error) {
    console.error('Error fetching employees:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Get employee by ID
export const getEmployeeById = async (employeeId: string): Promise<ApiResponse<Employee | null>> => {
  try {
    const response = await fetch(`${API_BASE_URL}?employee_id=${employeeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error fetching employee:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Create new employee
export const createEmployee = async (employee: Omit<Employee, 'employee_id'>): Promise<ApiResponse<Employee>> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(employee),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error creating employee:', error);
    return {
      success: false,
      data: {} as Employee,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Update employee
export const updateEmployee = async (employeeId: string, employee: Partial<Employee>): Promise<ApiResponse<Employee>> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ employee_id: employeeId, ...employee }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      data: data,
    };
  } catch (error) {
    console.error('Error updating employee:', error);
    return {
      success: false,
      data: {} as Employee,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Delete employee
export const deleteEmployee = async (employeeId: string): Promise<ApiResponse<boolean>> => {
  try {
    const response = await fetch(API_BASE_URL, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ employee_id: employeeId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: true,
    };
  } catch (error) {
    console.error('Error deleting employee:', error);
    return {
      success: false,
      data: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
