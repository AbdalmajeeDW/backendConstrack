// tenant/invoices/invoices.service.ts
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { TenantService } from '../../superAdmin/tenant/tenant.service';
import { Invoice, InvoiceStatus } from './entity/invoice.entity';
import { Employee } from '../employee/employee.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import * as path from 'path';
import * as fs from 'fs';
import { extname } from 'path';
import { TenantLogsService } from '../logs/logs.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectDataSource('master')
    private readonly dataSource: DataSource,
    private readonly tenantService: TenantService,
    private readonly logsService: TenantLogsService,
  ) {}

  private async createTenantConnection(databaseName: string) {
    const options = this.dataSource.options as any;
    const connection = new DataSource({
      type: options.type,
      host: options.host,
      port: options.port,
      username: options.username,
      password: options.password,
      database: databaseName,
      entities: [Invoice, Employee],
      synchronize: false,
      logging: false,
      charset: 'utf8mb4',
      dateStrings: true,
    });
    await connection.initialize();
    return connection;
  }

  private async getTenantDatabaseName(tenantId: string): Promise<string> {
    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    if (tenant.status !== 'active') {
      throw new Error('Tenant is inactive');
    }
    return tenant.databaseName;
  }

  private async saveImages(
    databaseName: string,
    files: Express.Multer.File[],
  ): Promise<string[]> {
    const uploadDir = `./uploads/tenants/${databaseName}/invoices`;

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const savedPaths: string[] = [];

    for (const file of files) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const fileName = `${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, fileName);

      if (file.path) {
        fs.renameSync(file.path, filePath);
      } else if (file.buffer) {
        fs.writeFileSync(filePath, file.buffer);
      }

      savedPaths.push(`/uploads/tenants/${databaseName}/invoices/${fileName}`);
    }

    return savedPaths;
  }

  private async getTenantDatabaseNameById(tenantId: string) {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    const tenant = await this.tenantService.findById(tenantId);
    if (!tenant) {
      throw new Error(`Tenant with ID ${tenantId} not found`);
    }
    if (tenant.status !== 'active') {
      throw new Error('Tenant is inactive');
    }
    return tenant.databaseName;
  }
  async create(
    tenantId: string,
    dto: CreateInvoiceDto,
    files?: Express.Multer.File[],
    employeeId?: number,
    ipAddress?: string,
    userAgent?: string,
    userRole?: string,
  ) {
    const databaseName = await this.getTenantDatabaseNameById(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      let imagePaths: string[] = [];
      if (files && files.length > 0) {
        imagePaths = await this.saveImages(databaseName, files);
      }

      const imagesJson = JSON.stringify(imagePaths);

      const result = await connection.query(
        `
      INSERT INTO invoices 
      (employee_id, images, description, status, invoice_date)
      VALUES (?, ?, ?, ?, UTC_TIMESTAMP())
      `,
        [
          dto.employee_id,
          imagesJson,
          dto.description || null,
          dto.status || 'pending',
        ],
      );

      if (employeeId && userRole === 'tenant_employee') {
        try {
          const message = {
            en: `Uploaded invoice with ${imagePaths.length} images`,
            ar: `تم رفع فاتورة تحتوي على ${imagePaths.length} صور  `,
          };

          await this.logsService.logActivity(tenantId, {
            employeeId: employeeId,
            action: 'upload_invoice',
            details: JSON.stringify(message),
            ipAddress: ipAddress,
            userAgent: userAgent,
          });
        } catch (logError) {
          console.error('⚠️ Failed to log activity:', logError);
        }
      }

      return {
        id: result.insertId,
        message: 'Invoice created successfully',
        images: imagePaths,
      };
    } catch (error: any) {
      console.error('❌ Failed to create invoice:', error);
      throw new InternalServerErrorException(error.message);
    } finally {
      await connection.destroy();
    }
  }
  private lastRequestTime: Record<string, number> = {};

  async findAll(tenantId: string) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const invoiceRepository = connection.getRepository(Invoice);

      const invoices = await invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.employee', 'employee')
        .select([
          'invoice',
          'employee.id',
          'employee.name',
          'employee.email',
          'employee.phone',
        ])
        .orderBy('invoice.created_at', 'DESC')
        .getMany();

      return invoices;
    } finally {
      await connection.destroy();
    }
  }

  async findOne(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const invoiceRepository = connection.getRepository(Invoice);

      const invoice = await invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.employee', 'employee')
        .select([
          'invoice',
          'employee.id',
          'employee.name',
          'employee.email',
          'employee.phone',
        ])
        .where('invoice.id = :id', { id })
        .getOne();

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      return invoice;
    } finally {
      await connection.destroy();
    }
  }

  async findByEmployee(
    tenantId: string,
    employeeId: number,
    ipAddress?: string,
    userAgent?: string,
    userRole?: string,
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const invoiceRepository = connection.getRepository(Invoice);

      const invoices = await invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.employee', 'employee')
        .select([
          'invoice',
          'employee.id',
          'employee.name',
          'employee.email',
          'employee.phone',
        ])
        .where('invoice.employee_id = :employeeId', { employeeId })
        .orderBy('invoice.created_at', 'DESC')
        .getMany();
      if (userRole === 'tenant_employee' && employeeId) {
        const key = `view_invoices_${employeeId}`;
        const now = Date.now();
        const lastTime = this.lastRequestTime[key] || 0;
        const message = {
          en: `Viewed all invoices (${invoices.length} invoices)`,
          ar: `تم عرض جميع الفواتير (${invoices.length} فواتير)`,
        };
        if (now - lastTime > 500) {
          this.lastRequestTime[key] = now;

          await this.logsService.logActivity(tenantId, {
            employeeId: employeeId,
            action: 'view_invoices',
            details: JSON.stringify(message),
            ipAddress: ipAddress,
            userAgent: userAgent,
          });
        }
      }
      return invoices;
    } finally {
      await connection.destroy();
    }
  }

  async update(
    tenantId: string,
    id: number,
    dto: UpdateInvoiceDto,
    files?: Express.Multer.File[],
  ) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const invoiceRepository = connection.getRepository(Invoice);

      const invoice = await invoiceRepository.findOne({
        where: { id },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (dto.employee_id !== undefined) invoice.employee_id = dto.employee_id;
      if (dto.description !== undefined) invoice.description = dto.description;
      if (dto.status !== undefined) invoice.status = dto.status;
      if (dto.invoice_date !== undefined)
        invoice.invoice_date = new Date(dto.invoice_date);

      if (files && files.length > 0) {
        const newImages = await this.saveImages(databaseName, files);
        invoice.images = [...(invoice.images || []), ...newImages];
      }

      await invoiceRepository.save(invoice);

      return invoice;
    } finally {
      await connection.destroy();
    }
  }

  async updateStatus(tenantId: string, id: number, status: InvoiceStatus) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const invoiceRepository = connection.getRepository(Invoice);

      const invoice = await invoiceRepository.findOne({
        where: { id },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      invoice.status = status;
      await invoiceRepository.save(invoice);

      return invoice;
    } finally {
      await connection.destroy();
    }
  }

  async delete(tenantId: string, id: number) {
    const databaseName = await this.getTenantDatabaseName(tenantId);
    const connection = await this.createTenantConnection(databaseName);

    try {
      const invoiceRepository = connection.getRepository(Invoice);

      const invoice = await invoiceRepository.findOne({
        where: { id },
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      // حذف الصور من السيرفر
      if (invoice.images && invoice.images.length > 0) {
        for (const imagePath of invoice.images) {
          const fullPath = path.join('./uploads', imagePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      }

      await invoiceRepository.delete(id);

      return { message: 'Invoice deleted successfully' };
    } finally {
      await connection.destroy();
    }
  }
}
