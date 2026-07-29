import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantService } from '../../superAdmin/tenant/tenant.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class ProjectsService {
  constructor(
    private tenantService: TenantService,

    @InjectDataSource('master')
    private dataSource: DataSource,
  ) {}

async create(tenantId: string, dto: CreateProjectDto) {
  const databaseName =
    await this.tenantService.getTenantDatabaseNameById(tenantId);

  const result = await this.dataSource.query(
    `
    INSERT INTO \`${databaseName}\`.projects
    (name,description,client_name,client_phone,location,city,postal_code,status,start_date,end_date)
    VALUES (?,?,?,?,?,?,?,?,?,?)
    `,
    [
      dto.name,
      dto.description ?? null,
      dto.client_name ?? null,
      dto.client_phone ?? null,
      dto.location ?? null,
      dto.city ?? null,
      dto.postal_code ?? null,
      dto.status ?? null,
      dto.start_date ?? null,
      dto.end_date ?? null,
    ],
  );

  const projectId = result.insertId;

  const [project] = await this.dataSource.query(
    `
    SELECT *
    FROM \`${databaseName}\`.projects
    WHERE id = ?
    `,
    [projectId],
  );

  return project;
}

  async findAll(tenantId: string) {
    const databaseName =
      await this.tenantService.getTenantDatabaseNameById(tenantId);

    return await this.dataSource.query(
      `
SELECT *
FROM \`${databaseName}\`.projects
ORDER BY created_at DESC
`,
    );
  }
}
