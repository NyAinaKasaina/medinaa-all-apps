import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

// Référence géographique dénormalisée (codification officielle INSTAT, structure data-personne).
@Entity('fokontany')
export class Fokontany {
  @PrimaryColumn({ name: 'code_fokontany', length: 8 })
  codeFokontany: string;

  @Index()
  @Column({ name: 'code_faritra', length: 2 })
  codeFaritra: string;

  @Index()
  @Column({ name: 'code_distrika', length: 4 })
  codeDistrika: string;

  @Index()
  @Column({ name: 'code_kaominina', length: 6 })
  codeKaominina: string;

  @Column({ name: 'nom_faritra' })
  nomFaritra: string;

  @Column({ name: 'nom_distrika' })
  nomDistrika: string;

  @Column({ name: 'nom_kaominina' })
  nomKaominina: string;

  @Column({ name: 'nom_fokontany' })
  nomFokontany: string;
}
