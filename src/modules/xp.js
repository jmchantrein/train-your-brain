/**
 * Module XP - Calculs d'expérience et progression
 *
 * Gère les calculs de points d'expérience, niveaux et progression du joueur
 */

const XP = {
  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════

  // XP gagné par résultat de carte
  CARD_XP: {
    purple: 1,
    orange: 2,
    green: 3
  },

  // Bonus de streak (série de cartes vertes) - progression logarithmique
  // Paliers: écart croissant (3, 3, 3, 3, 6, 7, 10, 15, 25...)
  STREAK_BONUSES: [
    { streak: 3, xp: 5 },
    { streak: 6, xp: 15 },
    { streak: 9, xp: 30 },
    { streak: 12, xp: 50 },
    { streak: 18, xp: 75 },
    { streak: 25, xp: 110 },
    { streak: 35, xp: 160 },
    { streak: 50, xp: 230 },
    { streak: 75, xp: 350 },
    { streak: 100, xp: 500 }
  ],

  // Niveaux visuels de la série de cartes vertes (affichage en jeu et célébrations).
  // Les paliers de bonus (STREAK_BONUSES) et ces niveaux sont la seule définition de la série.
  STREAK_TIERS: [
    { min: 3, id: 'active' },
    { min: 6, id: 'hot' },
    { min: 12, id: 'epic' },
    { min: 25, id: 'legendary' },
    { min: 50, id: 'mythic' }
  ],

  // ═══════════════════════════════════════════════════════════════
  // FONCTIONS PUBLIQUES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcule l'XP gagné pour une carte
   *
   * @param {string} newBox - La nouvelle boîte de la carte ('purple'|'orange'|'green')
   * @returns {number} - XP gagné (1, 2 ou 3, ou 0 si boîte invalide)
   *
   * @example
   * XP.calculateXpForCard('purple') // → 1
   * XP.calculateXpForCard('green') // → 3
   * XP.calculateXpForCard('never_played') // → 0
   */
  calculateXpForCard(newBox) {
    return this.CARD_XP[newBox] ?? 0;
  },

  /**
   * Calcule le bonus XP du palier courant d'une série de cartes vertes
   *
   * @param {number} greenStreak - Nombre de cartes vertes consécutives
   * @returns {number} - Bonus XP (progression logarithmique: 5 → 15 → 30 → 50 → 75 → 110 → 160 → 230 → 350 → 500)
   *
   * Note : renvoie le bonus du palier franchi pour toute série >= palier. Pour verser
   * le bonus UNE SEULE FOIS, au moment où la série atteint le palier, utiliser
   * getStreakMilestoneBonus.
   * Paliers: 3, 6, 9, 12, 18, 25, 35, 50, 75, 100 (écart croissant)
   *
   * @example
   * XP.calculateStreakBonus(2) // → 0
   * XP.calculateStreakBonus(3) // → 5
   * XP.calculateStreakBonus(12) // → 50
   * XP.calculateStreakBonus(25) // → 110
   * XP.calculateStreakBonus(100) // → 500
   */
  calculateStreakBonus(greenStreak) {
    // Gestion des cas limites
    if (greenStreak < 0) return 0;

    // Trouver le bonus correspondant (ordre décroissant)
    for (let i = this.STREAK_BONUSES.length - 1; i >= 0; i--) {
      if (greenStreak >= this.STREAK_BONUSES[i].streak) {
        return this.STREAK_BONUSES[i].xp;
      }
    }

    // Aucun palier atteint
    return 0;
  },

  /**
   * Bonus XP versé quand la série de cartes vertes ATTEINT un palier
   *
   * Contrairement à calculateStreakBonus (bonus du palier courant), ne rend une valeur
   * que si la série vaut exactement un palier : le bonus est donc versé une seule fois,
   * au moment où le palier est atteint, et jamais pour les cartes suivantes.
   *
   * @param {number} greenStreak - Série de cartes vertes après la carte jouée
   * @returns {number} - Bonus XP (0 si la série n'est pas exactement un palier)
   *
   * @example
   * XP.getStreakMilestoneBonus(3) // → 5
   * XP.getStreakMilestoneBonus(4) // → 0
   * XP.getStreakMilestoneBonus(12) // → 50
   */
  getStreakMilestoneBonus(greenStreak) {
    const milestone = this.STREAK_BONUSES.find(b => b.streak === greenStreak);
    return milestone ? milestone.xp : 0;
  },

  /**
   * Niveau visuel d'une série de cartes vertes
   *
   * @param {number} greenStreak - Série de cartes vertes
   * @returns {string} - 'none' | 'active' | 'hot' | 'epic' | 'legendary' | 'mythic'
   */
  getStreakTier(greenStreak) {
    let tier = 'none';
    for (const t of this.STREAK_TIERS) {
      if (greenStreak >= t.min) tier = t.id;
    }
    return tier;
  },

  /**
   * Crédite de l'XP au joueur et indique si le niveau a changé
   *
   * Point d'entrée unique pour tout gain d'XP (carte, bonus, badge, défi) : l'appelant
   * peut ainsi détecter la montée de niveau à chaque gain. N'écrit pas dans xpHistory
   * (l'appelant choisit la source et le libellé).
   *
   * @param {Object} player - Joueur (stats.totalXP est modifié)
   * @param {number} amount - XP gagné (les valeurs <= 0 ou invalides sont ignorées)
   * @returns {{ previousLevel: number, newLevel: number, leveledUp: boolean }}
   */
  grant(player, amount) {
    const previousLevel = this.calculateLevel(player.stats.totalXP);
    if (typeof amount === 'number' && amount > 0 && isFinite(amount)) {
      player.stats.totalXP += amount;
    }
    const newLevel = this.calculateLevel(player.stats.totalXP);
    return { previousLevel, newLevel, leveledUp: newLevel > previousLevel };
  },

  /**
   * Calcule le niveau à partir de l'XP total
   *
   * @param {number} totalXP - Points d'expérience total
   * @returns {number} - Niveau (1+)
   *
   * Formule : floor(sqrt(totalXP / 100)) + 1
   *
   * @example
   * XP.calculateLevel(0) // → 1
   * XP.calculateLevel(100) // → 2
   * XP.calculateLevel(400) // → 3
   * XP.calculateLevel(10000) // → 11
   */
  calculateLevel(totalXP) {
    // Gestion des cas limites
    if (totalXP < 0) return 1;

    return Math.floor(Math.sqrt(totalXP / 100)) + 1;
  },

  /**
   * Calcule l'XP nécessaire pour atteindre un niveau
   *
   * @param {number} level - Niveau cible
   * @returns {number} - XP requis
   *
   * Formule : (level - 1)² × 100
   *
   * @example
   * XP.xpForLevel(1) // → 0
   * XP.xpForLevel(2) // → 100
   * XP.xpForLevel(3) // → 400
   * XP.xpForLevel(11) // → 10000
   */
  xpForLevel(level) {
    // Gestion des cas limites
    if (level <= 0) return 0;

    return Math.pow(level - 1, 2) * 100;
  },

  /**
   * Calcule la progression vers le prochain niveau
   *
   * @param {number} totalXP - Points d'expérience total
   * @returns {number} - Progression entre 0 et 1
   *
   * Formule : (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP)
   *
   * @example
   * XP.xpProgress(0) // → 0 (début niveau 1)
   * XP.xpProgress(50) // → 0.5 (milieu niveau 1)
   * XP.xpProgress(100) // → 0 (début niveau 2)
   * XP.xpProgress(250) // → 0.5 (milieu niveau 2)
   */
  xpProgress(totalXP) {
    const currentLevel = this.calculateLevel(totalXP);
    const currentLevelXP = this.xpForLevel(currentLevel);
    const nextLevelXP = this.xpForLevel(currentLevel + 1);

    // Calcul de la progression
    const progress = (totalXP - currentLevelXP) / (nextLevelXP - currentLevelXP);

    // Assurer que le résultat est entre 0 et 1
    return Math.max(0, Math.min(1, progress));
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = XP;
}
