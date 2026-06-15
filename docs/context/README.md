# docs/context — Contexte vivant du projet Medinaa

Ce dossier est la **source de vérité opérationnelle** du projet, maintenue à jour au fil de l'eau. Il complète (et corrige) le `CLAUDE.md` racine, qui décrit une version périmée du projet.

Pour Claude comme pour un nouveau contributeur, lire dans cet ordre :

| Fichier | Rôle | Quand le lire / mettre à jour |
|---|---|---|
| [`etat-du-projet.md`](etat-du-projet.md) | Ce qui existe réellement (archi, endpoints, schéma, conventions) | Lire en premier. Mettre à jour à chaque changement structurel. |
| [`dette-et-risques.md`](dette-et-risques.md) | Backlog priorisé des problèmes connus (cases à cocher) | Cocher en fermant un point ; ajouter les nouveaux. |
| [`reorg-schema-plan.md`](reorg-schema-plan.md) | Plan de la réorganisation du schéma | Pendant la réorg ; archiver une fois faite. |
| [`journal-decisions.md`](journal-decisions.md) | Journal des décisions (ADR léger) + leçons | Ajouter une entrée à chaque décision structurante ou erreur évitée. |
| [`../audit/2026-06-13-audit-complet.md`](../audit/2026-06-13-audit-complet.md) | L'audit fondateur (preuves, fichier:ligne) | Référence figée. |

## Règle d'or pour Claude

Avant de modifier le **schéma de données** ou un **contrat d'API**, vérifier l'impact sur les **3 apps** (backend + frontend + mobile). L'interface `MedicalEntity` est dupliquée dans `frontend/src/lib/api.ts` et `mobile/src/lib/api.ts` : il n'existe aucun garde-fou de compilation entre apps, donc un renommage de champ casse silencieusement le front/mobile.

## Conventions de rédaction

Documents en français, sans tiret long (em dash), sans mention de Claude/Anthropic dans les commits (voir préférences globales de Mickael). Dater au format absolu (`YYYY-MM-DD`).
