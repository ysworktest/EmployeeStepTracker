export interface Company {
  id: string;
  name: string;
  created_at: string;
}

export interface Employee {
  employeeId: string;
  company: string;
  isActive: boolean;
  deviceId: string | null;
  profileName: string | null;
  registrationDate: string | null;
  created_at: string;
}

export interface RegistrationFormData {
  employeeId: string;
  company: string;
  profileName: string;
}
