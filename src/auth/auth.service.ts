// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

type User = { id: number; username: string; passwordHash: string; displayName?: string };

@Injectable()
export class AuthService {
  // demo users - ในโปรดักชัน ใช้ DB แทนนี้
  private users: User[] = [
    { id: 1, username: 'admin', passwordHash: bcrypt.hashSync('password', 10), displayName: 'Admin' },
    { id: 2, username: 'emp001', passwordHash: bcrypt.hashSync('secret', 10), displayName: 'Employee 001' },
  ];

  constructor(private jwtService: JwtService) {}

  async validateUser(username: string, pass: string) {
    const user = this.users.find(u => u.username === username);
    if (!user) return null;
    const matched = await bcrypt.compare(pass, user.passwordHash);
    if (!matched) return null;
    const { passwordHash, ...result } = user;
    return result;
  }

  async login(user: { id: number; username: string }) {
    const payload = { sub: user.id, username: user.username };
    const access_token = this.jwtService.sign(payload);
    return { access_token };
  }
}