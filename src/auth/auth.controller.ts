// src/auth/auth.controller.ts
import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { username: string; password: string; remember?: boolean }, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(body.username, body.password);
    if (!user) {
      return { statusCode: 401, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' };
    }

    const token = await this.authService.login(user as any);

    const cookieOptions: any = {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
    };
    if (body.remember) {
      cookieOptions.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 วัน
    }

    res.cookie('Authentication', token.access_token, cookieOptions);
    return { access_token: token.access_token };
  }

  @Get('refresh')
  async refresh(@Req() req: Request) {
    const token = req.cookies?.Authentication;
    if (!token) return { ok: false, message: 'no cookie' };
    // ถ้าต้องการ re-issue token ให้ verify และ sign ใหม่ — ที่นี้ return token เดิม (หรือ verify ตามต้องการ)
    return { access_token: token };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('Authentication', { httpOnly: true, sameSite: 'lax', secure: false });
    return { ok: true };
  }
}