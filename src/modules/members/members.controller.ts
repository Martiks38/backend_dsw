import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { MembersService } from './members.service';
import {
  CreateMemberDto,
  CreateMemberResponseDto,
  MemberResponseDto,
  MessageResponseDto,
  UpdateMemberDto,
  UpdateMemberResponseDto,
} from './dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo member (User + Member)' })
  @ApiResponse({ status: 201, type: CreateMemberResponseDto })
  @ApiResponse({ status: 409, description: 'Email o document ya registrado' })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Busca un member por publicId' })
  @ApiParam({ name: 'publicId', description: 'Identificador público' })
  @ApiResponse({ status: 200, type: MemberResponseDto })
  @ApiResponse({ status: 404, description: 'Member no encontrado' })
  findOne(@Param('publicId') publicId: string) {
    return this.membersService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Actualiza un member existente' })
  @ApiParam({ name: 'publicId', description: 'Identificador público' })
  @ApiResponse({ status: 200, type: UpdateMemberResponseDto })
  @ApiResponse({ status: 404, description: 'Member no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'El email o documento ya está registrado por otro member',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(publicId, updateMemberDto);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Eliminación (soft delete) un member' })
  @ApiParam({
    name: 'publicId',
    description: 'Identificador público',
  })
  @ApiResponse({
    status: 200,
    description: 'Member eliminado correctamente',
    type: MessageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Member no encontrado' })
  remove(@Param('publicId') publicId: string) {
    return this.membersService.remove(publicId);
  }
}
