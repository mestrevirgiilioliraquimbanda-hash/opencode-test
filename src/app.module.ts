import { Module } from '@nestjs/common';
import { ArenaController } from './controllers/arena.controller.js';
import { PlayerController } from './controllers/player.controller.js';

@Module({
  controllers: [
    ArenaController,
    PlayerController
  ],
  providers: [],
})
export class AppModule {}
