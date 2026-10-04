import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { SetActiveStatusDto } from '@/common/dto/set-active-status.dto';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { FindClientsDto } from './dto/find-clients.dto';

@UseGuards(JwtAuthGuard)
@Controller('clientes')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('options')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  async getOptions() {
    return this.clientsService.findAllOptions();
  }

  @Get()
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  getAll(@Query() dto: FindClientsDto) {
    return this.clientsService.getAllPaginated(dto);
  }

  @Post()
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto);
  }

  @Patch(':publicId/status')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  setStatus(
    @Param('publicId') publicId: string,
    @Body() dto: SetActiveStatusDto,
  ) {
    return this.clientsService.setStatus(publicId, dto.isActive);
  }
}
