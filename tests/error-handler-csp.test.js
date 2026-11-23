/**
 * ErrorHandler : aucun gestionnaire d'événement en ligne (onclick="...") dans le HTML généré.
 * La Content-Security-Policy de index.html n'autorise pas les scripts en ligne par attribut ; les
 * boutons sont donc reliés par addEventListener (attributs data-error-action).
 */

describe('ErrorHandler - sans gestionnaires en ligne (CSP)', () => {
  function cleanup() {
    document.querySelectorAll('.error-modal-overlay, #error-toast-container').forEach(el => el.remove());
    document.body.style.overflow = '';
  }
  afterEach(cleanup);

  it('should render the error modal without inline handlers, and close it on click', () => {
    ErrorHandler.showErrorModal('Titre', 'Message', ['a']);
    const overlay = document.querySelector('.error-modal-overlay');
    expect(overlay).toBeTruthy();
    expect(overlay.querySelector('[onclick]')).toBeNull();
    overlay.querySelector('[data-error-action="close-modal"]').click();
    expect(document.querySelector('.error-modal-overlay')).toBeNull();
  });

  it('should render the toast without inline handlers, and close it on click', () => {
    ErrorHandler.showErrorToast('t', 'm');
    const toast = document.querySelector('.error-toast');
    expect(toast.querySelector('[onclick]')).toBeNull();
    toast.querySelector('[data-error-action="close-toast"]').click();
    expect(toast.classList.contains('error-toast--closing')).toBe(true);
  });

  it('should render the developer popup without inline handlers', () => {
    ErrorHandler.showDevErrorPopup({ type: 'x', message: 'm', userMessage: { title: 't', message: 'm' }, timestamp: 'now', stack: 's' });
    const overlay = document.querySelector('.dev-error-popup');
    expect(overlay).toBeTruthy();
    expect(overlay.querySelector('[onclick]')).toBeNull();
    expect(overlay.querySelector('[data-error-action="copy"]')).toBeTruthy();
    overlay.querySelector('[data-error-action="close-modal"]').click();
    expect(document.querySelector('.dev-error-popup')).toBeNull();
  });

  it('should render the error page without inline handlers, with a working home button', () => {
    const container = document.createElement('div');
    ErrorHandler._renderErrorPage(container, 'home', new Error('boom'));
    expect(container.querySelector('[onclick]')).toBeNull();
    expect(container.querySelector('[data-error-action="home"]')).toBeTruthy();
    expect(container.querySelector('[data-error-action="reload"]')).toBeTruthy();
  });
});
