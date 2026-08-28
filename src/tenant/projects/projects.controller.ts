import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  Req,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';

import { ProjectsService } from './projects.service';
import { TenantJwtAuthGuard } from '../auth/tenant-jwt-auth.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

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

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.projectsService.findOne(tenantId, +id);
  }

  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.projectsService.update(tenantId, +id, updateProjectDto);
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.projectsService.remove(tenantId, +id);
  }
}
