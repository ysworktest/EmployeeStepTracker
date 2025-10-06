export const validateEmployeeId = (employeeId: string): string | null => {
  if (!employeeId || employeeId.trim() === '') {
    return 'Employee ID is required';
  }

  if (employeeId.length !== 7) {
    return 'Employee ID must be exactly 7 characters';
  }

  if (!employeeId.startsWith('K')) {
    return 'Employee ID must start with "K"';
  }

  const regex = /^K[A-Za-z0-9]{6}$/;
  if (!regex.test(employeeId)) {
    return 'Employee ID must contain only letters and numbers';
  }

  return null;
};

export const validateProfileName = (profileName: string): string | null => {
  if (!profileName || profileName.trim() === '') {
    return 'Profile name is required';
  }

  if (profileName.trim().length < 2) {
    return 'Profile name must be at least 2 characters';
  }

  return null;
};

export const validateCompany = (company: string): string | null => {
  if (!company || company.trim() === '') {
    return 'Company is required';
  }

  return null;
};
