/**
 * Module Effects - Effets visuels (confettis, XP flottant)
 *
 * Fournit des animations visuelles pour améliorer l'expérience utilisateur :
 * - Confettis pour les réussites et fin de session
 * - XP flottant animé lors des gains
 */

/** Échappe le texte avant insertion dans innerHTML (messages/badges potentiellement non fiables) */
function _effectsEscape(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const Effects = {
  // ═══════════════════════════════════════════════════════════════
  // CONFETTI SYSTEM
  // ═══════════════════════════════════════════════════════════════

  confetti: {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,
    isRunning: false,

    // Configuration
    config: {
      particleCount: 150,
      gravity: 0.3,
      friction: 0.99,
      colors: [
        '#8b5cf6', // purple
        '#f97316', // orange
        '#22c55e', // green
        '#3b82f6', // blue
        '#fbbf24', // yellow
        '#ec4899', // pink
        '#14b8a6', // teal
        '#f43f5e'  // red
      ],
      shapes: ['square', 'circle', 'triangle'],
      spread: 70,
      startVelocity: 30,
      decay: 0.94,
      scalar: 1
    },

    /**
     * Lance les confettis
     * @param {Object} [options] - Options de personnalisation
     */
    launch(options = {}) {
      const config = { ...this.config, ...options };

      // Créer le canvas s'il n'existe pas
      if (!this.canvas) {
        this._createCanvas();
      }

      // Générer les particules
      this._generateParticles(config);

      // Démarrer l'animation si pas déjà en cours
      if (!this.isRunning) {
        this.isRunning = true;
        this._animate();
      }

      // Auto-cleanup après 5 secondes
      setTimeout(() => this.stop(), 5000);
    },

    /**
     * Lance des confettis depuis un point spécifique
     * @param {number} x - Position X (0-1, relatif à la largeur)
     * @param {number} y - Position Y (0-1, relatif à la hauteur)
     * @param {Object} [options]
     */
    burst(x = 0.5, y = 0.5, options = {}) {
      this.launch({
        ...options,
        origin: { x, y }
      });
    },

    /**
     * Lance des confettis des deux côtés de l'écran
     */
    celebrateVictory() {
      this.burst(0.1, 0.6, { particleCount: 80, angle: 60 });
      setTimeout(() => {
        this.burst(0.9, 0.6, { particleCount: 80, angle: 120 });
      }, 150);
    },

    /**
     * Arrête l'animation des confettis
     */
    stop() {
      this.isRunning = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
      this.particles = [];

      // Nettoyer le canvas après un court délai
      setTimeout(() => {
        if (this.canvas && this.ctx) {
          this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
      }, 100);
    },

    /**
     * Supprime le canvas et nettoie les event listeners
     */
    destroy() {
      this.stop();
      if (this._resizeListener) {
        window.removeEventListener('resize', this._resizeListener);
        this._resizeListener = null;
      }
      if (this.canvas) {
        this.canvas.remove();
        this.canvas = null;
        this.ctx = null;
      }
    },

    // ─────────────────────────────────────────────────────────────
    // MÉTHODES PRIVÉES
    // ─────────────────────────────────────────────────────────────

    _createCanvas() {
      this.canvas = document.createElement('canvas');
      this.canvas.id = 'confetti-canvas';
      this.canvas.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 99999;
      `;
      document.body.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');

      // Adapter à la taille de l'écran
      this._resize();
      // Stocker la référence du listener pour cleanup
      this._resizeListener = () => this._resize();
      window.addEventListener('resize', this._resizeListener);
    },

    _resize() {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    },

    _generateParticles(config) {
      const { particleCount, colors, shapes, startVelocity, spread, scalar, origin } = config;
      const originX = (origin?.x ?? 0.5) * this.canvas.width;
      const originY = (origin?.y ?? 0.3) * this.canvas.height;
      const angle = (config.angle ?? 90) * (Math.PI / 180);

      for (let i = 0; i < particleCount; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const angleOffset = (Math.random() - 0.5) * spread * (Math.PI / 180);
        const velocity = startVelocity * (0.5 + Math.random() * 0.5);

        this.particles.push({
          x: originX,
          y: originY,
          vx: Math.cos(angle + angleOffset) * velocity,
          vy: -Math.sin(angle + angleOffset) * velocity,
          color,
          shape,
          size: (5 + Math.random() * 5) * scalar,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          opacity: 1,
          decay: config.decay + Math.random() * 0.02
        });
      }
    },

    _animate() {
      if (!this.isRunning) return;

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Mettre à jour et dessiner les particules
      this.particles = this.particles.filter(p => {
        // Appliquer la physique
        p.vy += this.config.gravity;
        p.vx *= this.config.friction;
        p.vy *= this.config.friction;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.opacity *= p.decay;

        // Dessiner
        if (p.opacity > 0.01) {
          this._drawParticle(p);
          return true;
        }
        return false;
      });

      // Continuer ou arrêter
      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this._animate());
      } else {
        this.stop();
      }
    },

    _drawParticle(p) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation * Math.PI / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;

      switch (p.shape) {
        case 'circle':
          this.ctx.beginPath();
          this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          this.ctx.fill();
          break;

        case 'triangle':
          this.ctx.beginPath();
          this.ctx.moveTo(0, -p.size / 2);
          this.ctx.lineTo(p.size / 2, p.size / 2);
          this.ctx.lineTo(-p.size / 2, p.size / 2);
          this.ctx.closePath();
          this.ctx.fill();
          break;

        case 'square':
        default:
          this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          break;
      }

      this.ctx.restore();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // FLOATING XP SYSTEM
  // ═══════════════════════════════════════════════════════════════

  floatingXP: {
    container: null,

    /**
     * Affiche un XP flottant animé
     * @param {number} amount - Montant d'XP gagné
     * @param {Object} [options] - Options { x, y, color }
     */
    show(amount, options = {}) {
      const { x, y, color, element } = options;

      // Créer le conteneur s'il n'existe pas
      if (!this.container) {
        this._createContainer();
      }

      // Créer l'élément XP
      const xpEl = document.createElement('div');
      xpEl.className = 'floating-xp';
      xpEl.innerHTML = `<span class="floating-xp__icon">⭐</span><span class="floating-xp__value">+${amount}</span>`;

      // Positionner
      if (element) {
        const rect = element.getBoundingClientRect();
        xpEl.style.left = `${rect.left + rect.width / 2}px`;
        xpEl.style.top = `${rect.top}px`;
      } else if (x !== undefined && y !== undefined) {
        xpEl.style.left = `${x}px`;
        xpEl.style.top = `${y}px`;
      } else {
        // Position par défaut (centre-haut)
        xpEl.style.left = '50%';
        xpEl.style.top = '30%';
      }

      // Couleur personnalisée
      if (color) {
        xpEl.style.setProperty('--floating-xp-color', color);
      }

      // Ajouter et animer
      this.container.appendChild(xpEl);

      // Supprimer après l'animation
      setTimeout(() => {
        xpEl.remove();
      }, 1500);
    },

    /**
     * Affiche plusieurs XP en cascade
     * @param {Array} gains - Tableau de { amount, delay }
     * @param {Object} [options]
     */
    showMultiple(gains, options = {}) {
      gains.forEach(({ amount, delay = 0 }) => {
        setTimeout(() => this.show(amount, options), delay);
      });
    },

    _createContainer() {
      this.container = document.createElement('div');
      this.container.id = 'floating-xp-container';
      this.container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 99998;
        overflow: hidden;
      `;
      document.body.appendChild(this.container);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // STREAK EFFECTS
  // ═══════════════════════════════════════════════════════════════

  streak: {
    /**
     * Affiche un effet de streak (feu/étoiles)
     * @param {number} count - Nombre dans le streak
     * @param {HTMLElement} element - Élément près duquel afficher
     */
    show(count, element) {
      const fire = document.createElement('div');
      fire.className = 'streak-fire';
      fire.innerHTML = count >= 6 ? '🔥🔥' : '🔥';

      if (element) {
        const rect = element.getBoundingClientRect();
        fire.style.left = `${rect.right + 10}px`;
        fire.style.top = `${rect.top + rect.height / 2}px`;
      }

      document.body.appendChild(fire);

      setTimeout(() => fire.remove(), 1000);
    },

    /**
     * Affiche une célébration de milestone de streak
     * @param {number} milestone - Le palier atteint (3, 6, 9, 12, 18, 25, 35, 50, 75, 100)
     */
    celebrateMilestone(milestone) {
      // Déterminer le niveau de célébration
      // Niveaux définis une seule fois, dans XP.STREAK_TIERS
      const level = XP.getStreakTier(milestone);

      // Créer l'élément de célébration
      const celebration = document.createElement('div');
      celebration.className = `streak-milestone streak-milestone--${level}`;
      celebration.innerHTML = `
        <div class="streak-milestone__icon">${this._getMilestoneIcon(milestone)}</div>
        <div class="streak-milestone__text">
          <span class="streak-milestone__label">STREAK</span>
          <span class="streak-milestone__value">${milestone}</span>
        </div>
        <div class="streak-milestone__bonus">+${this._getBonusXP(milestone)} XP</div>
      `;

      document.body.appendChild(celebration);

      // Lancer des confettis pour les gros milestones
      if (milestone >= 12 && Effects.confetti) {
        setTimeout(() => {
          const intensity = milestone >= 50 ? 200 : milestone >= 25 ? 150 : 100;
          Effects.confetti.burst(0.5, 0.4, { particleCount: intensity });
        }, 200);
      }

      // Supprimer après l'animation
      setTimeout(() => {
        celebration.classList.add('streak-milestone--closing');
        setTimeout(() => celebration.remove(), 300);
      }, 2500);
    },

    _getMilestoneIcon(milestone) {
      if (milestone >= 75) return '👑';
      if (milestone >= 50) return '💎';
      if (milestone >= 35) return '🌟';
      if (milestone >= 25) return '⭐⭐';
      if (milestone >= 18) return '⭐';
      if (milestone >= 12) return '🔥🔥🔥🔥';
      if (milestone >= 9) return '🔥🔥🔥';
      if (milestone >= 6) return '🔥🔥';
      return '🔥';
    },

    _getBonusXP(milestone) {
      return XP.getStreakMilestoneBonus(milestone);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // LEVEL UP CELEBRATION
  // ═══════════════════════════════════════════════════════════════

  levelUp: {
    /**
     * Affiche une célébration de niveau supérieur
     * @param {number} newLevel - Nouveau niveau atteint
     * @param {Object} [options] - Options supplémentaires
     */
    show(newLevel, options = {}) {
      // Créer l'overlay
      const overlay = document.createElement('div');
      overlay.className = 'level-up-overlay';
      overlay.innerHTML = `
        <div class="level-up-modal">
          <div class="level-up-stars">✨</div>
          <div class="level-up-icon">⭐</div>
          <div class="level-up-title">${PageUtils.getTranslator()('game.levelUp')}</div>
          <div class="level-up-level">${newLevel}</div>
          <div class="level-up-subtitle">${PageUtils.getTranslator()('game.congratulations')}</div>
        </div>
      `;

      document.body.appendChild(overlay);

      // Lancer les confettis
      if (Effects.confetti) {
        setTimeout(() => Effects.confetti.celebrateVictory(), 200);
      }

      // Jouer le son de level up
      if (typeof Audio !== 'undefined' && Audio.playLevelUp) {
        Audio.playLevelUp();
      }

      // Fermer au clic ou après 3 secondes
      const close = () => {
        overlay.classList.add('level-up-overlay--closing');
        setTimeout(() => overlay.remove(), 300);
      };

      overlay.addEventListener('click', close);
      setTimeout(close, 3500);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // BADGE NOTIFICATION POPUP
  // ═══════════════════════════════════════════════════════════════

  badgePopup: {
    queue: [],
    isShowing: false,

    /**
     * Affiche une notification de badge débloqué
     * @param {Object} badge - Le badge débloqué { id, name, icon, description, rarity }
     */
    show(badge) {
      this.queue.push(badge);
      if (!this.isShowing) {
        this._showNext();
      }
    },

    /**
     * Annonce des badges obtenus ensemble : un seul badge = popup individuelle,
     * plusieurs = une seule popup groupée (pas de rafale de popups successives)
     * @param {Array} badges - Tableau de badges
     */
    showMultiple(badges) {
      if (!badges || badges.length === 0) return;
      this.queue.push(badges.length === 1 ? badges[0] : { group: badges });
      if (!this.isShowing) {
        this._showNext();
      }
    },

    _showNext() {
      if (this.queue.length === 0) {
        this.isShowing = false;
        return;
      }

      this.isShowing = true;
      const badge = this.queue.shift();

      const rarityColors = {
        common: '#6b7280',
        rare: '#3b82f6',
        epic: '#8b5cf6',
        legendary: '#f59e0b'
      };

      const _t = PageUtils.getTranslator();
      const popup = document.createElement('div');

      if (badge.group) {
        // Popup groupée : le titre donne le nombre, la rareté la plus haute colore la popup
        const order = ['common', 'rare', 'epic', 'legendary'];
        const best = badge.group.reduce((acc, b) => (
          order.indexOf(b.rarity) > order.indexOf(acc) ? b.rarity : acc
        ), 'common');
        popup.className = `badge-popup badge-popup--${order.includes(best) ? best : 'common'}`;
        popup.innerHTML = `
          <div class="badge-popup__glow"></div>
          <div class="badge-popup__content">
            <div class="badge-popup__icon">${badge.group.map(b => _effectsEscape(b.icon || '🏆')).join(' ')}</div>
            <div class="badge-popup__info">
              <div class="badge-popup__title">${_effectsEscape(_t('game.badgesUnlockedMany', { count: badge.group.length }))}</div>
              <div class="badge-popup__name">${badge.group.map(b => _effectsEscape(b.name)).join(', ')}</div>
            </div>
          </div>
        `;
      } else {
        popup.className = `badge-popup badge-popup--${badge.rarity || 'common'}`;
        popup.innerHTML = `
          <div class="badge-popup__glow"></div>
          <div class="badge-popup__content">
            <div class="badge-popup__icon">${_effectsEscape(badge.icon || '🏆')}</div>
            <div class="badge-popup__info">
              <div class="badge-popup__title">${_t('game.badgeUnlocked')}</div>
              <div class="badge-popup__name">${_effectsEscape(badge.name)}</div>
              <div class="badge-popup__description">${_effectsEscape(badge.description || '')}</div>
            </div>
          </div>
        `;
      }

      document.body.appendChild(popup);

      // Jouer le son de badge débloqué
      if (typeof Audio !== 'undefined' && Audio.playBadgeUnlocked) {
        Audio.playBadgeUnlocked();
      }

      // Supprimer après 4 secondes et passer au suivant
      setTimeout(() => {
        popup.classList.add('badge-popup--closing');
        setTimeout(() => {
          popup.remove();
          this._showNext();
        }, 300);
      }, 4000);
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// CSS pour les effets (injecté dynamiquement)
// ═══════════════════════════════════════════════════════════════

(function injectEffectsStyles() {
  if (document.getElementById('effects-styles')) return;

  const style = document.createElement('style');
  style.id = 'effects-styles';
  style.textContent = `
    /* Floating XP */
    .floating-xp {
      position: absolute;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px 16px;
      background: linear-gradient(135deg, var(--floating-xp-color, var(--color-purple, #8b5cf6)), var(--color-purple-dark, #7c3aed));
      color: white;
      border-radius: 20px;
      font-weight: bold;
      font-size: 1.1rem;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
      transform: translateX(-50%);
      animation: floating-xp-anim 1.5s ease-out forwards;
      pointer-events: none;
      z-index: 99998;
    }

    .floating-xp__icon {
      font-size: 1.2rem;
    }

    @keyframes floating-xp-anim {
      0% {
        opacity: 0;
        transform: translateX(-50%) translateY(0) scale(0.5);
      }
      20% {
        opacity: 1;
        transform: translateX(-50%) translateY(-20px) scale(1.1);
      }
      40% {
        transform: translateX(-50%) translateY(-30px) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateX(-50%) translateY(-80px) scale(0.8);
      }
    }

    /* Streak Fire */
    .streak-fire {
      position: fixed;
      font-size: 2rem;
      transform: translateY(-50%);
      animation: streak-fire-anim 1s ease-out forwards;
      pointer-events: none;
      z-index: 99998;
    }

    @keyframes streak-fire-anim {
      0% {
        opacity: 0;
        transform: translateY(-50%) scale(0.5);
      }
      30% {
        opacity: 1;
        transform: translateY(-50%) scale(1.3);
      }
      100% {
        opacity: 0;
        transform: translateY(-50%) translateY(-30px) scale(0.8);
      }
    }

    /* Streak Milestone Celebration - Positionné au-dessus de la jauge streak */
    .streak-milestone {
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 16px 28px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 100000;
      animation: streak-milestone-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .streak-milestone--active {
      border: 3px solid #f97316;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 30px rgba(249, 115, 22, 0.3);
    }

    .streak-milestone--hot {
      border: 3px solid #ef4444;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(239, 68, 68, 0.4);
    }

    .streak-milestone--epic {
      border: 3px solid #8b5cf6;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(139, 92, 246, 0.5);
      animation: streak-milestone-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                 streak-milestone-pulse-epic 1.5s ease-in-out infinite;
    }

    .streak-milestone--legendary {
      border: 3px solid #fbbf24;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 60px rgba(251, 191, 36, 0.6);
      animation: streak-milestone-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                 streak-milestone-pulse-legendary 1.2s ease-in-out infinite;
    }

    .streak-milestone--mythic {
      border: 3px solid transparent;
      background: linear-gradient(135deg, #1e293b, #0f172a) padding-box,
                  linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #ff6b6b) border-box;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
                  0 0 80px rgba(255, 107, 107, 0.4),
                  0 0 80px rgba(72, 219, 251, 0.4);
      animation: streak-milestone-appear 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                 streak-milestone-rainbow 3s linear infinite;
    }

    .streak-milestone--closing {
      animation: streak-milestone-disappear 0.3s ease-in forwards;
    }

    .streak-milestone__icon {
      font-size: 2.5rem;
      animation: streak-icon-bounce 0.6s ease-out;
    }

    .streak-milestone--mythic .streak-milestone__icon {
      animation: streak-icon-bounce 0.6s ease-out, streak-icon-spin 2s linear infinite;
    }

    .streak-milestone__text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .streak-milestone__label {
      font-size: 0.9rem;
      font-weight: 600;
      letter-spacing: 4px;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .streak-milestone__value {
      font-size: 2rem;
      font-weight: bold;
      line-height: 1;
    }

    .streak-milestone--active .streak-milestone__value {
      color: #f97316;
    }

    .streak-milestone--hot .streak-milestone__value {
      color: #ef4444;
    }

    .streak-milestone--epic .streak-milestone__value {
      color: #8b5cf6;
    }

    .streak-milestone--legendary .streak-milestone__value {
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .streak-milestone--mythic .streak-milestone__value {
      background: linear-gradient(135deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: streak-value-shimmer 2s linear infinite;
      background-size: 200% auto;
    }

    .streak-milestone__bonus {
      margin-top: 4px;
      padding: 4px 12px;
      background: rgba(34, 197, 94, 0.2);
      border: 1px solid rgba(34, 197, 94, 0.4);
      border-radius: 16px;
      color: #22c55e;
      font-weight: 600;
      font-size: 0.9rem;
      animation: streak-bonus-pulse 1s ease-in-out infinite;
    }

    @keyframes streak-milestone-appear {
      0% {
        opacity: 0;
        transform: translateX(-50%) scale(0.3) translateY(20px);
      }
      50% {
        transform: translateX(-50%) scale(1.1);
      }
      100% {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
    }

    @keyframes streak-milestone-disappear {
      0% {
        opacity: 1;
        transform: translateX(-50%) scale(1);
      }
      100% {
        opacity: 0;
        transform: translateX(-50%) scale(0.8) translateY(-20px);
      }
    }

    @keyframes streak-milestone-pulse-epic {
      0%, 100% {
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 50px rgba(139, 92, 246, 0.5);
      }
      50% {
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 80px rgba(139, 92, 246, 0.8);
      }
    }

    @keyframes streak-milestone-pulse-legendary {
      0%, 100% {
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 60px rgba(251, 191, 36, 0.6);
      }
      50% {
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6), 0 0 100px rgba(251, 191, 36, 1);
      }
    }

    @keyframes streak-milestone-rainbow {
      0% {
        filter: hue-rotate(0deg);
      }
      100% {
        filter: hue-rotate(360deg);
      }
    }

    @keyframes streak-icon-bounce {
      0%, 100% { transform: translateY(0) scale(1); }
      30% { transform: translateY(-15px) scale(1.2); }
      50% { transform: translateY(-5px) scale(1.1); }
      70% { transform: translateY(-8px) scale(1.05); }
    }

    @keyframes streak-icon-spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes streak-bonus-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    @keyframes streak-value-shimmer {
      0% { background-position: 200% center; }
      100% { background-position: -200% center; }
    }

    /* Level Up Overlay */
    .level-up-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 100000;
      animation: level-up-fade-in 0.3s ease-out;
    }

    .level-up-overlay--closing {
      animation: level-up-fade-out 0.3s ease-in forwards;
    }

    .level-up-modal {
      text-align: center;
      animation: level-up-scale-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .level-up-stars {
      font-size: 2rem;
      margin-bottom: 1rem;
      animation: level-up-stars 1s ease-in-out infinite;
    }

    .level-up-icon {
      font-size: 4rem;
      margin-bottom: 0.5rem;
      animation: level-up-bounce 0.6s ease-out;
    }

    .level-up-title {
      font-size: 1.5rem;
      font-weight: bold;
      color: #fbbf24;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .level-up-level {
      font-size: 5rem;
      font-weight: bold;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1;
    }

    .level-up-subtitle {
      font-size: 1.2rem;
      color: #94a3b8;
      margin-top: 0.5rem;
    }

    @keyframes level-up-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes level-up-fade-out {
      from { opacity: 1; }
      to { opacity: 0; }
    }

    @keyframes level-up-scale-in {
      from {
        opacity: 0;
        transform: scale(0.5);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes level-up-bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes level-up-stars {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }

    /* Badge Popup */
    .badge-popup {
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #1e293b, #334155);
      border-radius: 12px;
      padding: 16px 20px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 100000;
      animation: badge-popup-slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      max-width: 320px;
      border: 2px solid transparent;
    }

    .badge-popup--common {
      border-color: #6b7280;
    }

    .badge-popup--rare {
      border-color: #3b82f6;
    }

    .badge-popup--epic {
      border-color: #8b5cf6;
    }

    .badge-popup--legendary {
      border-color: #f59e0b;
      animation: badge-popup-slide-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                 badge-popup-glow 2s ease-in-out infinite;
    }

    .badge-popup--closing {
      animation: badge-popup-slide-out 0.3s ease-in forwards;
    }

    .badge-popup__glow {
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border-radius: 14px;
      background: inherit;
      filter: blur(10px);
      opacity: 0.3;
      z-index: -1;
    }

    .badge-popup__content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge-popup__icon {
      font-size: 2.5rem;
      flex-shrink: 0;
    }

    .badge-popup__info {
      flex: 1;
    }

    .badge-popup__title {
      font-size: 0.75rem;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    .badge-popup__name {
      font-size: 1.1rem;
      font-weight: bold;
      color: #f8fafc;
      margin-bottom: 4px;
    }

    .badge-popup__description {
      font-size: 0.85rem;
      color: #94a3b8;
      line-height: 1.3;
    }

    @keyframes badge-popup-slide-in {
      from {
        opacity: 0;
        transform: translateX(100px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes badge-popup-slide-out {
      from {
        opacity: 1;
        transform: translateX(0);
      }
      to {
        opacity: 0;
        transform: translateX(100px);
      }
    }

    @keyframes badge-popup-glow {
      0%, 100% {
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.3);
      }
      50% {
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5), 0 0 40px rgba(245, 158, 11, 0.6);
      }
    }

    /* Respect prefers-reduced-motion */
    @media (prefers-reduced-motion: reduce) {
      .floating-xp,
      .streak-fire,
      .streak-milestone,
      .streak-milestone__icon,
      .streak-milestone__bonus,
      .level-up-overlay,
      .level-up-modal,
      .level-up-stars,
      .level-up-icon,
      .badge-popup {
        animation: none !important;
      }

      .floating-xp {
        transform: translateX(-50%) translateY(-30px);
        opacity: 1;
      }

      .badge-popup {
        opacity: 1;
        transform: translateX(0);
      }

      .level-up-overlay {
        opacity: 1;
      }

      .level-up-modal {
        opacity: 1;
        transform: scale(1);
      }

      .streak-milestone {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
    }

    /* Mobile responsive pour badge popup */
    @media (max-width: 480px) {
      .badge-popup {
        top: auto;
        bottom: 80px;
        right: 10px;
        left: 10px;
        max-width: none;
      }

      .streak-milestone {
        padding: 24px 32px;
      }

      .streak-milestone__icon {
        font-size: 3rem;
      }

      .streak-milestone__value {
        font-size: 2.5rem;
      }
    }
  `;
  document.head.appendChild(style);
})();

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Effects };
}
