import { Module } from '@nestjs/common';

import { BoatDeparturesController } from './boat-departure.controller';
import { BoatDepartureService } from './boat-departure.service';

@Module({
  controllers: [BoatDeparturesController],
  providers: [BoatDepartureService],
})
export class BoatDeparturesModule {}
