import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthService } from './auth.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'src/prisma.module';
import { SendgridService } from 'src/sendgrid/sendgrid.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UserModule,
    PrismaModule,
    JwtModule.register({
      global: true,
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    AuthService,
    JwtService,
    PrismaService,
    SendgridService,
  ],
})
export class UserModule {}
