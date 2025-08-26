// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  // ข้อมูลผู้ใช้แบบ hardcode
  private readonly user = {
    username: 'admin',
    password: '1234'
  };

  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, password: string): Promise<any> {
    // ตรวจสอบ username
    if (username !== this.user.username) {
      return null;
    }
    
    // ตรวจสอบ password
    const isPasswordValid = await bcrypt.compare(password, this.user.password);
    if (!isPasswordValid) {
      return null;
    }
    
    // return user object (without password)
    return { username: this.user.username };
  }

  async login(user: any) {
    const payload = { username: user.username, sub: 'admin' };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}