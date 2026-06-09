import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from './user.entity'
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  async create(email: string, password: string): Promise<User> {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = this.repo.create({ email, passwordHash })
    return this.repo.save(user)
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repo.findOneBy({ email })
  }

  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne()
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOneBy({ id })
  }
}
