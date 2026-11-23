# Questions Techniques - Décisions à Prendre

> **État** : plan, non réalisé.

> **Statut** : À discuter avant implémentation
> **Format** : Question → Options → Recommandation (si applicable)

---

## 1. Langage Backend

### Question
Quel langage/runtime utiliser pour le serveur DeckHub ?

### Options

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **Node.js** | Même langage que core, LLM connaît bien, npm partagé | Perf modérée, callback hell |
| **Deno** | Moderne, TypeScript natif, sécurisé par défaut | Écosystème moins mature |
| **Bun** | Ultra rapide, compatible Node, TypeScript natif | Jeune, moins testé en prod |
| **Go** | Très performant, binaire unique, bon pour API | Langage différent, contexte LLM séparé |
| **Python (FastAPI)** | Rapide à dev, bon pour IA/validation | Runtime différent, déploiement plus lourd |

### Recommandation
**Node.js** ou **Bun** pour rester dans l'écosystème JavaScript et faciliter le travail LLM en monorepo.

---

## 2. Base de Données

### Question
Comment stocker les decks et métadonnées ?

### Options

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **SQLite** | Simple, fichier unique, zéro config | Limité en concurrence |
| **PostgreSQL** | Robuste, JSON natif, scalable | Nécessite un serveur |
| **MongoDB** | Flexible (JSON), scalable | Overhead pour petit projet |
| **GitHub (fichiers)** | Gratuit, versionné, PR = modération | Limité en requêtes API |
| **Turso (SQLite edge)** | SQLite + distribué + gratuit tier | Vendor lock-in |

### Recommandation
**SQLite** pour le MVP (simplicité), migration vers **PostgreSQL** ou **Turso** si besoin de scale.

---

## 3. Hébergement

### Question
Où déployer le serveur DeckHub ?

### Options

| Option | Coût | Avantages | Inconvénients |
|--------|------|-----------|---------------|
| **Railway** | Gratuit (500h/mois) | Simple, Node natif | Limite horaire |
| **Fly.io** | Gratuit (3 VMs) | Global, Docker | Config plus complexe |
| **Render** | Gratuit (spin down) | Simple, auto-deploy | Cold starts |
| **Cloudflare Workers** | Gratuit (100k req/jour) | Edge, très rapide | Limites runtime |
| **VPS (Hetzner)** | ~4€/mois | Contrôle total | Maintenance manuelle |
| **Vercel** | Gratuit (serverless) | Intégré Next.js | Limites serverless |

### Recommandation
**Fly.io** ou **Railway** pour commencer (gratuit), avec possibilité de migrer vers **VPS** si le trafic augmente.

---

## 4. Authentification

### Question
Comment gérer l'authentification pour la soumission de decks ?

### Options

| Option | Complexité | UX |
|--------|------------|-----|
| **Email magic link** | Faible | Bonne (pas de mot de passe) |
| **OAuth (GitHub/Google)** | Moyenne | Très bonne (1 clic) |
| **Anonyme + CAPTCHA** | Très faible | Moyenne (friction CAPTCHA) |
| **Compte classique** | Haute | Standard |

### Recommandation
**Email magic link** pour le MVP : simple, pas de mot de passe à gérer, vérifie l'email pour la modération.

---

## 5. Modération

### Question
Comment modérer les soumissions de decks ?

### Options

| Option | Effort | Qualité |
|--------|--------|---------|
| **Manuelle (humain)** | Élevé | Excellente |
| **LLM (Claude/GPT)** | Faible | Bonne |
| **Règles automatiques** | Faible | Moyenne |
| **Communautaire (votes)** | Variable | Variable |
| **Hybride (auto + humain)** | Moyen | Très bonne |

### Recommandation
**Hybride** : Validation automatique (format, duplicats, hallucinations) + review humain pour les cas limites.

---

## 6. Format des Decks

### Question
Quel format pour le stockage/échange des decks sur DeckHub ?

### Options

| Format | Avantages | Inconvénients |
|--------|-----------|---------------|
| **YAML** | Lisible, existant dans le projet | Parsing plus lent |
| **JSON** | Natif JS, rapide | Moins lisible |
| **YAML + JSON** | YAML stocké, JSON pour API | Conversion nécessaire |

### Recommandation
**YAML** en stockage (cohérent avec le projet), **JSON** en réponse API (performance).

---

## 7. Versioning des Decks

### Question
Faut-il gérer les versions des decks ?

### Options

| Option | Complexité | Utilité |
|--------|------------|---------|
| **Pas de versioning** | Nulle | Suffisant pour MVP |
| **Versions majeures** | Faible | Permet les corrections |
| **Git-like (branches)** | Haute | Overkill |

### Recommandation
**Versions majeures simples** (v1, v2, v3) avec possibilité de télécharger une version spécifique.

---

## 8. Nom de Domaine

### Question
Quel domaine pour le projet ?

### Options à vérifier

- [ ] `trainyourbrain.app` (Google domains)
- [ ] `trainyourbrain.io`
- [ ] `tyb.app` (court)
- [ ] `train-your-brain.com`
- [ ] Sous-domaine GitHub Pages (`username.github.io/train-your-brain`)

### Action
Vérifier la disponibilité et réserver avant le renommage.

---

## 9. API Versioning

### Question
Comment versionner l'API ?

### Options

| Option | Exemple | Avantages |
|--------|---------|-----------|
| **URL** | `/api/v1/decks` | Explicite |
| **Header** | `Accept: application/vnd.tyb.v1+json` | Propre |
| **Pas de version** | `/api/decks` | Simple (MVP) |

### Recommandation
**Pas de version** pour le MVP, ajouter `/v1/` si breaking changes.

---

## 10. Rate Limiting

### Question
Comment limiter les abus ?

### Recommandation

| Endpoint | Limite |
|----------|--------|
| `GET /api/decks` | 100 req/min/IP |
| `GET /api/decks/:id` | 60 req/min/IP |
| `POST /api/submit` | 5 req/heure/email |

---

## Décisions Prises

| Question | Décision | Date |
|----------|----------|------|
| - | - | - |

> Mettre à jour ce tableau au fur et à mesure des décisions.

---

## Prochaines Étapes

1. [ ] Discuter les questions prioritaires (1, 2, 3)
2. [ ] Réserver le nom de domaine
3. [ ] Créer la structure `server/` minimale
4. [ ] Implémenter le premier endpoint (`GET /api/health`)
