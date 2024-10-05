import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*', // 允许所有源访问，生产环境应指定具体域名
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      allowedHeaders: 'Content-Type, Accept, Authorization',
      credentials: true,
    },
  });

  // 监听所有网络接口
  await app.listen(3000, '0.0.0.0');
}
bootstrap();
