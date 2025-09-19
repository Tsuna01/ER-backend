import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

type User = { id: number; username: string; password: string; displayName?: string; role: string };

@Injectable()
export class AuthService {
  private users: User[] = [];

  constructor(private cfg: ConfigService, private jwt: JwtService) {
    const envUsers: User[] = [];
    for (let i = 1; i <= 10; i++) {
      const u = this.cfg.get<string>(`USER_${i}_USERNAME`);
      const p = this.cfg.get<string>(`USER_${i}_PASSWORD`);
      if (u && p) {
        envUsers.push({
          id: i,
          username: u.trim(),
          password: p, // <- เทียบแบบ plain
          displayName: this.cfg.get<string>(`USER_${i}_DISPLAY`) || u,
          role: this.cfg.get<string>(`USER_${i}_ROLE`) || 'user',
        });
      }
    }
    this.users = envUsers;

  }

  private signAccessToken(user: User) {
    return this.jwt.sign(
      { sub: user.id, username: user.username, displayName: user.displayName, role: user.role },
      { secret: this.cfg.get('JWT_ACCESS_SECRET'), expiresIn: this.cfg.get('JWT_ACCESS_EXPIRES') }
    );
  }

  private signRefreshToken(user: User) {
    return this.jwt.sign(
      { sub: user.id, username: user.username, role: user.role },
      { secret: this.cfg.get('JWT_REFRESH_SECRET'), expiresIn: this.cfg.get('JWT_REFRESH_EXPIRES') }
    );
  }

  async validate(username: string, password: string): Promise<User> {
    const u = username.trim(); 
    const user = this.users.find(x => x.username === u && x.password === password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(username: string, password: string) {
    const user = await this.validate(username, password);
    const accessToken = this.signAccessToken(user);
    const refreshToken = this.signRefreshToken(user);
    return { user, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.cfg.get('JWT_REFRESH_SECRET'),
      });
      const user = this.users.find(u => u.id === payload.sub);
      if (!user) throw new UnauthorizedException();
      const accessToken = this.signAccessToken(user);
      return { user, accessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
