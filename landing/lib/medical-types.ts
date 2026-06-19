// Suggestions de types d'établissement pour l'autocomplete de la barre de recherche.
// Liste courte de termes de recherche courants (alignée sur la taxonomie OSM/Medinaa).
const TYPES: Record<string, string[]> = {
  fr: [
    'Hôpital', 'Pharmacie', 'Médecin', 'Dispensaire', 'CSB', 'Clinique',
    'Centre de santé', 'Dentiste', 'Laboratoire', 'Maternité', 'Sage-femme',
    'Kinésithérapeute', 'Infirmier', 'Ophtalmologue', 'Opticien',
  ],
  en: [
    'Hospital', 'Pharmacy', 'Doctor', 'Dispensary', 'CSB', 'Clinic',
    'Health center', 'Dentist', 'Laboratory', 'Maternity', 'Midwife',
    'Physiotherapist', 'Nurse', 'Ophthalmologist', 'Optician',
  ],
};

// mg : miroir du français pour l'instant (traduction malgache en attente — cf. messages/mg.TODO.md)
TYPES.mg = TYPES.fr;

export function medicalTypes(locale: string): string[] {
  return TYPES[locale] ?? TYPES.fr;
}
