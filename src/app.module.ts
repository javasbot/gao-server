import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import config from '../config/local';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      ...config,
      autoLoadEntities: true,
      synchronize: true, // 在生产环境中应该关闭此选项，仅用于开发
      extra: {
        ssl: { rejectUnauthorized: false }, // 忽略 SSL 证书验证
      },
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
