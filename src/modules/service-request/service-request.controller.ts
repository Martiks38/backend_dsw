import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';

import { type AuthenticatedUser } from '../auth/auth.interface';
import { CurrentUser } from '../auth/decorators/currentUser.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AppRole } from '../auth/role.enum';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FindServiceRequestDto } from './dto/find-service-request.dto';
import { ServiceRequestService } from './service-request.service';

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

  @Get()
  @Roles(AppRole.OPERATOR, AppRole.ADMIN, AppRole.MEMBER)
  @UseGuards(RolesGuard)
  async getRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query() dto: FindServiceRequestDto,
  ) {
    if (user.role === AppRole.OPERATOR) {
      return this.serviceRequestService.getAllPaginated(dto, user.internalId);
    }

    if (user.role === AppRole.MEMBER) {
      return this.serviceRequestService.getAllPaginated(
        dto,
        undefined,
        user.internalId,
      );
    }

    return this.serviceRequestService.getAllPaginated(dto);
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
}
