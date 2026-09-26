import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { AssignServiceRequestDto } from './dto/assign.dto';
import { CancelServiceRequestDto } from './dto/cancel-service-request.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FindServiceRequestDto } from './dto/find-service-request.dto';
import { UpdateServiceRequestDto } from './dto/update-service-request.dto';
import { ServiceRequestService } from './service-request.service';
import { GetAllPaginatedOptions } from './types/service-request.type';

@UseGuards(JwtAuthGuard)
@Controller('service-requests')
export class ServiceRequestController {
  constructor(private readonly serviceRequestService: ServiceRequestService) {}

  @Get('today')
  @Roles(AppRole.OPERATOR)
  @UseGuards(RolesGuard)
  async getTodayRequest(@CurrentUser() user: AuthenticatedUser) {
    return this.serviceRequestService.getTodayServiceRequestsByOperator(
      user.internalId,
    );
  }

  @Get(':id')
  @Roles(AppRole.MEMBER, AppRole.OPERATOR, AppRole.ADMIN)
  @UseGuards(RolesGuard)
  getOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceRequestService.findOne(id, user);
  }

  @Get()
  @Roles(AppRole.ADMIN, AppRole.OPERATOR, AppRole.MEMBER)
  @UseGuards(RolesGuard)
  async getRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: FindServiceRequestDto,
  ) {
    const roleConfig: Record<AppRole, GetAllPaginatedOptions> = {
      [AppRole.ADMIN]: { includeStatusCounts: true },
      [AppRole.OPERATOR]: { operatorId: user.internalId },
      [AppRole.MEMBER]: { memberId: user.internalId },
    };

    return this.serviceRequestService.getAllPaginated(
      dto,
      roleConfig[user.role],
    );
  }

  @Post()
  @Roles(AppRole.MEMBER)
  @UseGuards(RolesGuard)
  async create(
    @Body() dto: CreateServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceRequestService.create(dto, user.internalId);
  }

  @Patch(':id')
  @Roles(AppRole.OPERATOR, AppRole.ADMIN)
  @UseGuards(RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceRequestService.updateManagement(id, dto, user);
  }

  @Patch(':id/assign')
  @Roles(AppRole.ADMIN)
  @UseGuards(RolesGuard)
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignServiceRequestDto,
  ) {
    return this.serviceRequestService.assign(id, dto);
  }

  @Patch(':id/cancelar')
  @Roles(AppRole.MEMBER, AppRole.ADMIN)
  @UseGuards(RolesGuard)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelServiceRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.serviceRequestService.cancel(id, user, dto.reason);
  }
}
