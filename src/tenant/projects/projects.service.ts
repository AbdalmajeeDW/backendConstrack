import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantService } from '../../superAdmin/tenant/tenant.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private tenantService: TenantService,

    @InjectDataSource('master')
    private dataSource: DataSource,
  ) {}
  private parseDate(dateString: string | null | undefined): Date | null {
    if (!dateString || dateString === '') return null;

    const date = new Date(dateString);

    date.setHours(12, 0, 0, 0);

    return date;
  }
  async create(tenantId: string, dto: CreateProjectDto) {    
    const databaseName =
      await this.tenantService.getTenantDatabaseNameById(tenantId);
    const startDate = this.parseDate(dto.start_date);
    const endDate = this.parseDate(dto.end_date);
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
        startDate ?? null,
        endDate ?? null,
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
  async update(tenantId: string, id: number, dto: UpdateProjectDto) {
    const databaseName =
      await this.tenantService.getTenantDatabaseNameById(tenantId);

    const [existingProject] = await this.dataSource.query(
      `
      SELECT * FROM \`${databaseName}\`.projects WHERE id = ?
      `,
      [id],
    );

    if (!existingProject) {
      throw new Error('Project not found');
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (dto.name !== undefined) {
      updates.push('name = ?');
      values.push(dto.name);
    }
    if (dto.description !== undefined) {
      updates.push('description = ?');
      values.push(dto.description);
    }
    if (dto.client_name !== undefined) {
      updates.push('client_name = ?');
      values.push(dto.client_name);
    }
    if (dto.client_phone !== undefined) {
      updates.push('client_phone = ?');
      values.push(dto.client_phone);
    }
    if (dto.location !== undefined) {
      updates.push('location = ?');
      values.push(dto.location);
    }
    if (dto.city !== undefined) {
      updates.push('city = ?');
      values.push(dto.city);
    }
    if (dto.postal_code !== undefined) {
      updates.push('postal_code = ?');
      values.push(dto.postal_code);
    }
    if (dto.status !== undefined) {
      updates.push('status = ?');
      values.push(dto.status);
    }
    if (dto.start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(dto.start_date);
    }
    if (dto.end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(dto.end_date);
    }

    updates.push('updated_at = NOW()');

    if (updates.length === 0) {
      return existingProject;
    }

    values.push(id);

    await this.dataSource.query(
      `
      UPDATE \`${databaseName}\`.projects
      SET ${updates.join(', ')}
      WHERE id = ?
      `,
      values,
    );

    const [updatedProject] = await this.dataSource.query(
      `
      SELECT *
      FROM \`${databaseName}\`.projects
      WHERE id = ?
      `,
      [id],
    );

    return updatedProject;
  }
  async remove(tenantId: string, id: number) {
    const databaseName =
      await this.tenantService.getTenantDatabaseNameById(tenantId);

    const [existingProject] = await this.dataSource.query(
      `
      SELECT * FROM \`${databaseName}\`.projects WHERE id = ?
      `,
      [id],
    );

    if (!existingProject) {
      throw new Error('Project not found');
    }

    await this.dataSource.query(
      `
      DELETE FROM \`${databaseName}\`.projects WHERE id = ?
      `,
      [id],
    );

    return { message: 'Project deleted successfully' };
  }
  // projects.service.ts
  async findOne(tenantId: string, id: number) {
    const databaseName =
      await this.tenantService.getTenantDatabaseNameById(tenantId);

    const [project] = await this.dataSource.query(
      `
    SELECT *
    FROM \`${databaseName}\`.projects
    WHERE id = ?
    `,
      [id],
    );

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }
}
