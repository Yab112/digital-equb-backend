import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EqubGroupsService } from './equb-groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { User } from '../users/user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('Equb Groups')
@ApiBearerAuth()
@Controller('groups')
export class EqubGroupsController {
  constructor(private readonly equbGroupsService: EqubGroupsService) {}

  @UseGuards(JwtAuthGuard)
  @Post() // Handles POST requests to /groups
  @ApiOperation({ summary: 'Create a new Equb group' })
  @ApiBody({ type: CreateGroupDto })
  @ApiResponse({ status: 201, description: 'Equb group created.' })
  create(
    @Body() createGroupDto: CreateGroupDto,
    @Req() req: Request, // Get the full request object
  ) {
    const user = req.user as User; // The user object is attached by JwtAuthGuard
    return this.equbGroupsService.createGroup(createGroupDto, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Join an existing Equb group' })
  @ApiResponse({ status: 200, description: 'Successfully joined the group.' })
  join(
    @Param('id', ParseUUIDPipe) groupId: string, // Get group ID from URL and validate it's a UUID
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.equbGroupsService.joinGroup(groupId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/pay') // Handles POST requests to /groups/some-uuid/pay
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make a payment for an Equb group' })
  @ApiResponse({ status: 200, description: 'Payment successful.' })
  makePayment(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.equbGroupsService.makePayment(groupId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/start') // Handles POST requests to /groups/some-uuid/start
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start an Equb group' })
  @ApiResponse({ status: 200, description: 'Group started successfully.' })
  startGroup(@Param('id', ParseUUIDPipe) groupId: string, @Req() req: Request) {
    const user = req.user as User;
    return this.equbGroupsService.startGroup(groupId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/process-cycle') // Handles POST requests to /groups/some-uuid/process-cycle
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process the next cycle for an Equb group' })
  @ApiResponse({ status: 200, description: 'Cycle processed successfully.' })
  processNextCycle(
    @Param('id', ParseUUIDPipe) groupId: string,
    @Req() req: Request,
  ) {
    const user = req.user as User;
    return this.equbGroupsService.processNextCycle(groupId, user);
  }
}
