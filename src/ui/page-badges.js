/**
 * Page Badges - Collection de badges
 *
 * Dépendances: Pages (pages-base.js), Components, Badges
 */

// ═══════════════════════════════════════════════════════════════
// BADGES - Collection de badges
// ═══════════════════════════════════════════════════════════════

Pages.badges = {
  render(state) {
    const { player } = state;

    if (!player) {
      return `<div class="page page--badges">${i18n.t('app.loading')}</div>`;
    }

    const allBadges = Badges.ALL;
    const stats = Badges.getStats(player);
    const categories = ['achievement', 'mastery', 'level', 'streak', 'performance', 'subject', 'secret'];

    return `
      <div class="page page--badges">
        <main class="page__content" id="main-content" role="main">
          <h1 class="badges__title">🏆 ${i18n.t('badges.title')}</h1>

          <div class="badges__stats">
            <span class="badges__count">${player.badges.length} / ${allBadges.length}</span>
            ${stats.hidden.unlocked > 0 ? `
              <span class="badges__secret-count">🔮 ${i18n.t('badges.secretsCount', { unlocked: stats.hidden.unlocked, total: stats.hidden.total })}</span>
            ` : ''}
          </div>

          ${categories.map(category => {
            const categoryBadges = Badges.getByCategory(category);
            if (categoryBadges.length === 0) return '';

            const categoryName = {
              achievement: i18n.t('sidebar.cat.achievement'),
              mastery: i18n.t('sidebar.cat.mastery'),
              level: i18n.t('sidebar.cat.level'),
              streak: i18n.t('sidebar.cat.streak'),
              performance: i18n.t('sidebar.cat.performance'),
              subject: i18n.t('sidebar.cat.subject'),
              secret: '🔮 ' + i18n.t('badges.cat.secret')
            }[category];

            return `
              <section class="badges__section ${category === 'secret' ? 'badges__section--secret' : ''}">
                <h2 class="badges__section-title">${categoryName}</h2>
                <div class="badges__grid">
                  ${categoryBadges.map(badge => {
                    const unlocked = player.badges.includes(badge.id);
                    return Components.badge.render({ badge, unlocked });
                  }).join('')}
                </div>
              </section>
            `;
          }).join('')}
        </main>

        ${PageUtils.renderFooter(player, 'badges')}
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);
  }
};
