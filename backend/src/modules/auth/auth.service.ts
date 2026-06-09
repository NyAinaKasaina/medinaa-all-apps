import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email)
    if (existing) throw new ConflictException('Email already in use')
    const user = await this.users.create(email, password)
    return { token: this.sign(user.id, user.email), user: { id: user.id, email: user.email } }
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email)
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')
    return { token: this.sign(user.id, user.email), user: { id: user.id, email: user.email } }
  }

  private sign(userId: string, email: string) {
    return this.jwt.sign({ sub: userId, email })
  }
}
