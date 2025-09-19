import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { JwtStrategy } from './jwt.strategy';
import { AuthGuard } from '@nestjs/passport';
import { UseGuards as UG } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private cfg: ConfigService) {}

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Res() res: Response
  ) {
    const { user, accessToken, refreshToken } = await this.auth.login(body.username, body.password);
    // เก็บ refresh token ใน httpOnly cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // โปรดตั้ง true เมื่อรัน https
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return res.json({ access_token: accessToken, user });
  }

  @Post('refresh')
async refresh(@Req() req: Request, @Res() res: Response) {
  const rt = req.cookies?.['refresh_token'];
  if (!rt) {
    // ไม่มีคุกกี้ → บอกว่าไม่ได้ล็อกอิน เฉย ๆ ก็พอ
    return res.status(204).send(); // No Content
  }
  try {
    const data = await this.auth.refresh(rt);
    return res.json({ access_token: data.accessToken, user: data.user });
  } catch {
    // โทเค็นเสีย/หมดอายุ → ล้างคุกกี้ทิ้ง ป้องกันเรียกซ้ำ
    res.clearCookie('refresh_token');
    return res.status(204).send();
  }
}

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('refresh_token');
    return res.json({ ok: true });
  }

  // ตัวอย่าง endpoint ที่ต้องล็อกอิน
  @Get('profile')
  @UG(AuthGuard('jwt'))
  getProfile(@Req() req: any) {
    return req.user;
  }

  // ตัวอย่าง endpoint ที่ต้อง role = admin
  @Get('admin-area')
  @UG(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  adminOnly(@Req() req: any) {
    return { msg: `hello admin ${req.user.username}` };
  }
}
