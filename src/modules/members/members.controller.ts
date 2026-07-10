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
import { CreateMemberDto, UpdateMemberDto } from './dto';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.membersService.create(createMemberDto);
  }

  @Get(':publicId')
  findOne(@Param('publicId') publicId: string) {
    return this.membersService.findOne(publicId);
  }

  @Patch(':publicId')
  update(
    @Param('publicId') publicId: string,
    @Body() updateMemberDto: UpdateMemberDto,
  ) {
    return this.membersService.update(publicId, updateMemberDto);
  }

  @Delete(':publicId')
  remove(@Param('publicId') publicId: string) {
    return this.membersService.remove(publicId);
  }
}
