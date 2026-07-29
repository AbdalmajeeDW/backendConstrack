import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ProjectsService } from './projects.service';
import { TenantJwtAuthGuard } from '../auth/tenant-jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('tenant/projects')
@UseGuards(TenantJwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(req.user.tenantId, dto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.projectsService.findAll(req.user.tenantId);
  }
}
