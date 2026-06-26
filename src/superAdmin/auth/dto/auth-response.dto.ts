// src/super-admin/auth/dto/auth-response.dto.ts
export class AuthResponseDto {
  access_token!: string;
  refresh_token!: string;
  expires_in!: number;
  user!: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}