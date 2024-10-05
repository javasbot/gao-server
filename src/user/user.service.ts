import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { username, password, email } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.usersRepository.create({
      username,
      password: hashedPassword,
      email, // 包含email字段
    });

    try {
      const res = await this.usersRepository.save(newUser); // 保存到数据库
      if (res.id) {
        return true;
      }
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new HttpException('用户名已存在', HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  async login(username: string, password: string) {
    const user = await this.usersRepository.findOne({ where: { username } });

    if (!user) {
      console.log(`User not found for username: ${username}`);
      throw new HttpException('用户名没找到', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      console.log(`Invalid password for username: ${username}`);
      throw new HttpException('用户名密码不匹配', HttpStatus.UNAUTHORIZED);
    }

    // 生成JWT
    const payload = { sub: user.id, username: user.username };
    const token = this.jwtService.sign(payload);

    return { token, user }; // 返回用户对象或任何其他你需要的信息
  }

  async findOneById(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }
}
