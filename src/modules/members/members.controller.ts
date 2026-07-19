import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { MessageResponseDto } from '@/common/dto/message-response.dto';

import {
  CreateMemberDto,
  CreateMemberResponseDto,
  MemberResponseDto,
  UpdateMemberDto,
  UpdateMemberResponseDto,
} from './dto';
import { MembersService } from './members.service';

@ApiTags('members')
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'Crea un nuevo socio (User + Member)' })
  @ApiCreatedResponse({ type: CreateMemberResponseDto })
  @ApiConflictResponse({
    description: 'Email o documento ya registrado para otro usuario',
  })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get(':publicId')
  @ApiOperation({ summary: 'Busca un socio por publicId' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'Identificador público',
  })
  @ApiOkResponse({ type: MemberResponseDto })
  @ApiNotFoundResponse({
    description: 'Socio no encontrado con el ID proporcionado',
  })
  findOne(@Param('publicId') publicId: string) {
    return this.membersService.findOne(publicId);
  }

  @Patch(':publicId')
  @ApiOperation({ summary: 'Actualiza los datos de un empleado' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'Identificador público',
  })
  @ApiBody({
    type: UpdateMemberDto,
    description: 'Campos del socio a modificar',
  })
  @ApiOkResponse({ type: UpdateMemberResponseDto })
  @ApiNotFoundResponse({
    description: 'Socio no encontrado o deshabilitado',
  })
  @ApiConflictResponse({
    description: 'El email o documento ya está registrado por otro usuario',
  })
  update(
    @Param('publicId') publicId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(publicId, updateMemberDto);
  }

  @Delete(':publicId')
  @ApiOperation({ summary: 'Deshabilitar un socio' })
  @ApiParam({
    name: 'publicId',
    type: 'string',
    description: 'Identificador público',
  })
  @ApiOkResponse({
    description: 'Member eliminado correctamente',
    type: MessageResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un socio activo con el ID proporcionado',
  })
  remove(@Param('publicId') publicId: string) {
    return this.membersService.remove(publicId);
  }
}
