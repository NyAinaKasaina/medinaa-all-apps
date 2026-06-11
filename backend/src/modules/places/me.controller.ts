import { Controller, Get, Request, UseGuards } from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PlacesService } from './places.service'

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
@UseGuards(JwtAuthGuard)
export class MeController {
  constructor(private readonly service: PlacesService) {}

  @Get('places')
  myPlaces(@Request() req: any) {
    return this.service.getByOwner(req.user.id)
  }
}
