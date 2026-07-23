export class EmployeeResponseDto {
  id!: number;
  name!: string;
  email!: string;
  phone?: string;
  is_active!: boolean;
  created_at!: Date;
  updated_at!: Date;
}
