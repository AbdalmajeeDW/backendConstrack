// invoice.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ParseIntPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { InvoicesService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { TenantJwtAuthGuard } from '../auth/tenant-jwt-auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { InvoiceStatus } from './entity/invoice.entity';

@Controller('tenant/invoices')
@UseGuards(TenantJwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 20,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('Only images are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  create(
    @Request() req: any,
    @Body() dto: CreateInvoiceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.invoicesService.create(
      req.user.tenantId,
      dto, 
      files, 
      req.user.id, 
      req.ip || req.socket.remoteAddress,
      req.headers['user-agent'], 
      req.user.role,
    );
  }

  @Get()
  findAll(@Request() req: any) {
    return this.invoicesService.findAll(req.user.tenantId);
  }

  @Get('employee/:employeeId')
  findByEmployee(
    @Request() req: any,
    @Param('employeeId', ParseIntPipe) employeeId: number,
  ) {

    return this.invoicesService.findByEmployee(req.user.tenantId, employeeId, 
   
      req.ip || req.socket.remoteAddress,
      req.headers['user-agent'], req.user.role);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @UseInterceptors(
    FilesInterceptor('images', 20, {
      storage: diskStorage({
        destination: './uploads/temp',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
        files: 20,
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(new Error('Only images are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvoiceDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.invoicesService.update(req.user.tenantId, id, dto, files);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: InvoiceStatus,
  ) {
    return this.invoicesService.updateStatus(req.user.tenantId, id, status);
  }

  @Delete(':id')
  delete(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.invoicesService.delete(req.user.tenantId, id);
  }
}
