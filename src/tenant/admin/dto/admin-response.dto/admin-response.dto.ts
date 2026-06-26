export class AdminResponseDto {
  id!: number;
  name!: string;
  email!: string;
  phone?: string;
  is_active!: boolean;
  role!: string;
  created_at!: Date;
  updated_at!: Date;
}