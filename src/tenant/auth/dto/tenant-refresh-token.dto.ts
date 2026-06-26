import { IsString } from 'class-validator';

export class TenantRefreshTokenDto {
  @IsString()
  refresh_token!: string;
}
