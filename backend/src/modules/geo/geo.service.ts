import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Fokontany } from './entities/fokontany.entity';

// Liste les niveaux administratifs (code + nom) depuis la table fokontany dénormalisée.
@Injectable()
export class GeoService {
  constructor(
    @InjectRepository(Fokontany)
    private readonly repo: Repository<Fokontany>,
  ) {}

  faritra() {
    return this.repo
      .createQueryBuilder('f')
      .select('f.code_faritra', 'code')
      .addSelect('f.nom_faritra', 'nom')
      .distinct(true)
      .orderBy('f.nom_faritra', 'ASC')
      .getRawMany();
  }

  distrika(codeFaritra: string) {
    return this.repo
      .createQueryBuilder('f')
      .select('f.code_distrika', 'code')
      .addSelect('f.nom_distrika', 'nom')
      .where('f.code_faritra = :cf', { cf: codeFaritra })
      .distinct(true)
      .orderBy('f.nom_distrika', 'ASC')
      .getRawMany();
  }

  kaominina(codeDistrika: string) {
    return this.repo
      .createQueryBuilder('f')
      .select('f.code_kaominina', 'code')
      .addSelect('f.nom_kaominina', 'nom')
      .where('f.code_distrika = :cd', { cd: codeDistrika })
      .distinct(true)
      .orderBy('f.nom_kaominina', 'ASC')
      .getRawMany();
  }
}
