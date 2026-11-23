/**
 * Module Audio - Sons synthétisés avec Web Audio API
 *
 * Génère des sons bienveillants et motivants pour le jeu
 */

const Audio = {
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /** @type {AudioContext|null} */
  _context: null,

  /** @type {GainNode|null} */
  _masterGain: null,

  /**
   * Entrée commune de la chaîne de sortie : toutes les voix s'y connectent.
   * Chaîne : voix → _bus (niveau de mixage) → limiteur doux → _masterGain (volume du joueur) → sortie.
   * @type {GainNode|null}
   */
  _bus: null,

  /** @type {boolean} */
  _enabled: true,

  /** @type {number} Volume global (0-1) */
  _volume: 0.5,

  // ═══════════════════════════════════════════════════════════════
  // ENVELOPPE ET CHAÎNE DE SORTIE (source de vérité unique)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Enveloppe commune à toutes les voix (secondes, sauf `overshoot`).
   * Chaque voix démarre à 0 et revient à 0 avant l'arrêt de l'oscillateur :
   * ni démarrage ni coupure à niveau non nul (donc pas de clic).
   */
  ENVELOPE: {
    minAttack: 0.012,   // attaque minimale : jamais de front raide
    minRelease: 0.06,   // relâchement minimal
    stopPad: 0.03,      // l'oscillateur s'arrête APRÈS la fin du relâchement
    overshoot: 1.25,    // crête d'attaque = niveau de maintien × overshoot
    peakCeiling: 0.8    // plafond du gain programmé d'une voix
  },

  /**
   * Chaîne de sortie commune : niveau de mixage puis compresseur doux
   * (limiteur : attrape les superpositions de sons avant le volume du joueur).
   */
  OUTPUT: {
    mixGain: 1.0,
    limiter: { threshold: -16, knee: 12, ratio: 8, attack: 0.005, release: 0.25 }
  },

  /** Ondes riches : toujours filtrées par un passe-bas (aucune n'est utilisée aujourd'hui). */
  SOFT_FILTER_HZ: 1800,

  /** Niveau de référence d'une mélodie : au-delà, ses voix sont atténuées (somme en puissance). */
  MELODY_REFERENCE_LEVEL: 0.6,

  // ═══════════════════════════════════════════════════════════════
  // FRÉQUENCES DES NOTES (La4 = 440 Hz, tempérament égal)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Fréquences des notes pour les octaves 2-6
   * Calculées à partir de La4 = 440 Hz en tempérament égal
   * Formule: f = 440 × 2^((n-69)/12) où n = numéro MIDI
   */
  NOTE_FREQUENCIES: {
    // Octave 2
    C2: 65.41, 'C#2': 69.30, Db2: 69.30, D2: 73.42, 'D#2': 77.78, Eb2: 77.78,
    E2: 82.41, F2: 87.31, 'F#2': 92.50, Gb2: 92.50, G2: 98.00, 'G#2': 103.83,
    Ab2: 103.83, A2: 110.00, 'A#2': 116.54, Bb2: 116.54, B2: 123.47,
    // Octave 3
    C3: 130.81, 'C#3': 138.59, Db3: 138.59, D3: 146.83, 'D#3': 155.56, Eb3: 155.56,
    E3: 164.81, F3: 174.61, 'F#3': 185.00, Gb3: 185.00, G3: 196.00, 'G#3': 207.65,
    Ab3: 207.65, A3: 220.00, 'A#3': 233.08, Bb3: 233.08, B3: 246.94,
    // Octave 4 (octave centrale, La4 = 440 Hz)
    C4: 261.63, 'C#4': 277.18, Db4: 277.18, D4: 293.66, 'D#4': 311.13, Eb4: 311.13,
    E4: 329.63, F4: 349.23, 'F#4': 369.99, Gb4: 369.99, G4: 392.00, 'G#4': 415.30,
    Ab4: 415.30, A4: 440.00, 'A#4': 466.16, Bb4: 466.16, B4: 493.88,
    // Octave 5
    C5: 523.25, 'C#5': 554.37, Db5: 554.37, D5: 587.33, 'D#5': 622.25, Eb5: 622.25,
    E5: 659.25, F5: 698.46, 'F#5': 739.99, Gb5: 739.99, G5: 783.99, 'G#5': 830.61,
    Ab5: 830.61, A5: 880.00, 'A#5': 932.33, Bb5: 932.33, B5: 987.77,
    // Octave 6
    C6: 1046.50, 'C#6': 1108.73, Db6: 1108.73, D6: 1174.66, 'D#6': 1244.51, Eb6: 1244.51,
    E6: 1318.51, F6: 1396.91, 'F#6': 1479.98, Gb6: 1479.98, G6: 1567.98, 'G#6': 1661.22,
    Ab6: 1661.22, A6: 1760.00, 'A#6': 1864.66, Bb6: 1864.66, B6: 1975.53
  },

  /**
   * Correspondance noms français → anglais
   */
  NOTE_NAMES_FR_TO_EN: {
    'do': 'C', 'ré': 'D', 're': 'D', 'mi': 'E', 'fa': 'F',
    'sol': 'G', 'la': 'A', 'si': 'B',
    'do#': 'C#', 'ré#': 'D#', 're#': 'D#', 'mi#': 'E#', 'fa#': 'F#',
    'sol#': 'G#', 'la#': 'A#', 'si#': 'B#',
    'dob': 'Cb', 'réb': 'Db', 'reb': 'Db', 'mib': 'Eb', 'fab': 'Fb',
    'solb': 'Gb', 'lab': 'Ab', 'sib': 'Bb'
  },

  /**
   * Correspondance noms anglais → français
   */
  NOTE_NAMES_EN_TO_FR: {
    'C': 'do', 'D': 'ré', 'E': 'mi', 'F': 'fa',
    'G': 'sol', 'A': 'la', 'B': 'si',
    'C#': 'do#', 'D#': 'ré#', 'E#': 'mi#', 'F#': 'fa#',
    'G#': 'sol#', 'A#': 'la#', 'B#': 'si#',
    'Cb': 'dob', 'Db': 'réb', 'Eb': 'mib', 'Fb': 'fab',
    'Gb': 'solb', 'Ab': 'lab', 'Bb': 'sib'
  },

  /**
   * Timbres disponibles (ratios d'harmoniques)
   * Chaque timbre définit l'amplitude relative des harmoniques
   */
  TIMBRES: {
    sine: { harmonics: [1], amplitudes: [1] },
    piano: { harmonics: [1, 2, 3, 4, 5, 6], amplitudes: [1, 0.5, 0.25, 0.15, 0.08, 0.04] },
    organ: { harmonics: [1, 2, 3, 4, 5, 6, 8], amplitudes: [1, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2] },
    flute: { harmonics: [1, 2, 3], amplitudes: [1, 0.1, 0.05] },
    clarinet: { harmonics: [1, 3, 5, 7], amplitudes: [1, 0.75, 0.5, 0.14] },
    brass: { harmonics: [1, 2, 3, 4, 5, 6], amplitudes: [1, 0.7, 0.5, 0.35, 0.25, 0.15] }
  },

  // ═══════════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialise le contexte audio
   * Doit être appelé après une interaction utilisateur
   */
  init() {
    if (this._context) return;

    try {
      this._context = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._context.createGain();
      this._masterGain.gain.value = this._volume;
      this._masterGain.connect(this._context.destination);
      this._buildOutputChain();
    } catch (e) {
      console.warn('Web Audio API non supportée:', e);
      this._enabled = false;
    }
  },

  /**
   * Définit le volume global
   * @param {number} volume - 0 à 1
   */
  setVolume(volume) {
    this._volume = Math.max(0, Math.min(1, volume));
    if (this._masterGain) {
      this._masterGain.gain.value = this._volume;
    }
  },

  /**
   * Reprend le contexte audio si suspendu
   */
  async resume() {
    if (this._context && this._context.state === 'suspended') {
      await this._context.resume();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITAIRES DE SYNTHÈSE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Construit la chaîne de sortie commune (bus de mixage + limiteur doux) devant le gain maître.
   * Sans compresseur disponible, le bus se connecte directement au gain maître.
   * @private
   */
  _buildOutputChain() {
    const ctx = this._context;
    const bus = ctx.createGain();
    bus.gain.value = this.OUTPUT.mixGain;
    if (typeof ctx.createDynamicsCompressor === 'function') {
      const lim = this.OUTPUT.limiter;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = lim.threshold;
      comp.knee.value = lim.knee;
      comp.ratio.value = lim.ratio;
      comp.attack.value = lim.attack;
      comp.release.value = lim.release;
      bus.connect(comp);
      comp.connect(this._masterGain);
    } else {
      bus.connect(this._masterGain);
    }
    this._bus = bus;
  },

  /**
   * Point d'entrée des voix dans la chaîne de sortie
   * @returns {AudioNode|null}
   * @private
   */
  _output() {
    return this._bus || this._masterGain;
  },

  /**
   * Programme l'enveloppe commune sur un paramètre de gain.
   * Part de 0, monte linéairement, décroît vers le maintien, puis revient à 0 à
   * `start + duration`. Attaque et relâchement sont bornés par ENVELOPE et par la durée
   * (jamais d'événements désordonnés, même pour une note très courte).
   * @param {AudioParam} param - Paramètre gain de la voix
   * @param {number} start - Début (s, temps du contexte)
   * @param {number} duration - Durée de la note (s)
   * @param {number} peak - Niveau de crête de l'attaque
   * @param {number} sustain - Niveau de maintien
   * @param {number} attack - Attaque demandée (s)
   * @param {number} decay - Décroissance demandée (s)
   * @param {number} release - Relâchement demandé (s)
   * @returns {number} Instant où le gain est revenu à 0
   * @private
   */
  _scheduleEnvelope(param, start, duration, peak, sustain, attack, decay, release) {
    const E = this.ENVELOPE;
    const t0 = Math.max(0, start);
    const dur = Math.max(0.02, duration);
    const a = Math.min(Math.max(attack, E.minAttack), dur * 0.4);
    const r = Math.min(Math.max(release, E.minRelease), dur * 0.6);
    const d = Math.max(0, Math.min(decay, dur - a - r));
    const top = Math.min(Math.max(peak, 0), E.peakCeiling);
    const hold = d > 0 ? Math.min(Math.max(sustain, 0), E.peakCeiling) : top;

    param.setValueAtTime(0, t0);
    param.linearRampToValueAtTime(top, t0 + a);
    if (d > 0) param.linearRampToValueAtTime(hold, t0 + a + d);
    // le maintien ne peut pas précéder la fin de la décroissance (arrondis flottants compris)
    param.setValueAtTime(hold, Math.max(t0 + a + d, t0 + dur - r));
    param.linearRampToValueAtTime(0, t0 + dur);
    return t0 + dur;
  },

  /**
   * Crée un oscillateur avec enveloppe ADSR commune (voir _scheduleEnvelope).
   * Le niveau de crête est dérivé du niveau de maintien (`sustain`).
   * Une onde riche (carrée, dents de scie) passe par un passe-bas.
   * @private
   */
  _createTone(frequency, type, startTime, duration, attack, decay, sustain, release) {
    if (!this._context || !this._enabled) return null;

    const osc = this._context.createOscillator();
    const gainNode = this._context.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    const end = this._scheduleEnvelope(
      gainNode.gain, startTime, duration,
      sustain * this.ENVELOPE.overshoot, sustain, attack, decay, release
    );

    if (type === 'square' || type === 'sawtooth') {
      const filter = this._context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = this.SOFT_FILTER_HZ;
      osc.connect(filter);
      filter.connect(gainNode);
    } else {
      osc.connect(gainNode);
    }
    gainNode.connect(this._output());

    osc.start(startTime);
    osc.stop(end + this.ENVELOPE.stopPad);

    return osc;
  },

  /**
   * Normalise un nom de note (FR ou EN) en format anglais avec octave
   * @param {string} noteName - Nom de la note (ex: "do", "C", "la#", "Bb")
   * @param {number} [octave=4] - Octave (2-6)
   * @returns {string|null} Note normalisée (ex: "C4", "A#4") ou null si invalide
   */
  _normalizeNoteName(noteName, octave = 4) {
    if (!noteName) return null;

    let note = noteName.toString().trim();
    let noteOctave = octave;

    // Vérifier si l'octave est incluse dans le nom (ex: "C4", "do3")
    const octaveMatch = note.match(/(\d)$/);
    if (octaveMatch) {
      noteOctave = parseInt(octaveMatch[1], 10);
      note = note.slice(0, -1);
    }

    // Convertir du français vers l'anglais si nécessaire
    const noteLower = note.toLowerCase();
    if (this.NOTE_NAMES_FR_TO_EN[noteLower]) {
      note = this.NOTE_NAMES_FR_TO_EN[noteLower];
    } else {
      // Normaliser la casse pour l'anglais (C, C#, Db...)
      note = note.charAt(0).toUpperCase() + note.slice(1).toLowerCase();
    }

    // Construire la clé de fréquence
    const noteKey = `${note}${noteOctave}`;

    // Vérifier que la note existe
    if (!this.NOTE_FREQUENCIES[noteKey]) {
      console.warn(`Note inconnue: ${noteKey}`);
      return null;
    }

    return noteKey;
  },

  /**
   * Obtient la fréquence d'une note
   * @param {string} noteName - Nom de la note (FR ou EN)
   * @param {number} [octave=4] - Octave (2-6)
   * @returns {number|null} Fréquence en Hz ou null si invalide
   */
  getFrequency(noteName, octave = 4) {
    const noteKey = this._normalizeNoteName(noteName, octave);
    return noteKey ? this.NOTE_FREQUENCIES[noteKey] : null;
  },

  // ═══════════════════════════════════════════════════════════════
  // SYNTHÈSE DE NOTES MUSICALES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Joue une note musicale (son pur - onde sinusoïdale)
   * @param {string} noteName - Nom de la note (FR: "do", "ré#" / EN: "C", "D#")
   * @param {number} [octave=4] - Octave (2-6)
   * @param {number} [duration=1] - Durée en secondes
   * @returns {boolean} true si la note a été jouée
   */
  playNote(noteName, octave = 4, duration = 1) {
    if (!this._context || !this._enabled) return false;
    this.resume();

    const frequency = this.getFrequency(noteName, octave);
    if (!frequency) return false;

    const now = this._context.currentTime;
    this._createTone(
      frequency,
      'sine',
      now,
      duration,
      0.02,    // attack
      0.1,     // decay
      0.6,     // sustain
      0.15     // release
    );

    return true;
  },

  /**
   * Joue une note avec un timbre spécifique (synthèse additive)
   * @param {string} noteName - Nom de la note (FR ou EN)
   * @param {number} [octave=4] - Octave (2-6)
   * @param {string} [timbre='piano'] - Timbre: 'sine', 'piano', 'organ', 'flute', 'clarinet', 'brass'
   * @param {number} [duration=1] - Durée en secondes
   * @returns {boolean} true si la note a été jouée
   */
  playNoteWithTimbre(noteName, octave = 4, timbre = 'piano', duration = 1) {
    if (!this._context || !this._enabled) return false;
    this.resume();

    const frequency = this.getFrequency(noteName, octave);
    if (!frequency) return false;

    const timbreData = this.TIMBRES[timbre] || this.TIMBRES.sine;
    const now = this._context.currentTime;

    // Amplitudes normalisées : la crête d'une note est la même quel que soit le timbre
    const total = timbreData.amplitudes.reduce((sum, x) => sum + x, 0) || 1;

    // Créer les harmoniques pour simuler le timbre
    timbreData.harmonics.forEach((harmonic, index) => {
      const harmonicFreq = frequency * harmonic;

      // Limiter aux fréquences audibles
      if (harmonicFreq > 20000) return;

      const share = (timbreData.amplitudes[index] || 0) / total;

      const osc = this._context.createOscillator();
      const gainNode = this._context.createGain();

      osc.type = 'sine';
      osc.frequency.value = harmonicFreq;

      // Enveloppe ADSR adaptée au timbre
      const attack = timbre === 'organ' ? 0.05 : 0.02;
      const decay = timbre === 'piano' ? 0.2 : 0.1;
      const release = timbre === 'piano' ? 0.3 : 0.15;

      const end = this._scheduleEnvelope(
        gainNode.gain, now, duration,
        share, share * 0.75, attack, decay, release
      );

      osc.connect(gainNode);
      gainNode.connect(this._output());

      osc.start(now);
      osc.stop(end + this.ENVELOPE.stopPad);
    });

    return true;
  },

  /**
   * Joue un intervalle (deux notes)
   * @param {string} note1 - Première note
   * @param {string} note2 - Deuxième note
   * @param {number} [octave=4] - Octave de la première note
   * @param {boolean} [simultaneous=false] - Jouer simultanément ou séquentiellement
   * @param {number} [duration=1] - Durée de chaque note
   * @returns {boolean} true si joué avec succès
   */
  playInterval(note1, note2, octave = 4, simultaneous = false, duration = 1) {
    if (!this._context || !this._enabled) return false;
    this.resume();

    const freq1 = this.getFrequency(note1, octave);
    const freq2 = this.getFrequency(note2, octave);

    if (!freq1 || !freq2) return false;

    const now = this._context.currentTime;

    if (simultaneous) {
      // Jouer les deux notes en même temps (niveau réduit : la somme reste au niveau d'une note)
      this._createTone(freq1, 'sine', now, duration, 0.02, 0.1, 0.35, 0.15);
      this._createTone(freq2, 'sine', now, duration, 0.02, 0.1, 0.35, 0.15);
    } else {
      // Jouer séquentiellement avec une petite pause
      const gap = 0.1;
      this._createTone(freq1, 'sine', now, duration, 0.02, 0.1, 0.5, 0.15);
      this._createTone(freq2, 'sine', now + duration + gap, duration, 0.02, 0.1, 0.5, 0.15);
    }

    return true;
  },

  /**
   * Joue un accord (plusieurs notes simultanées)
   * @param {string[]} notes - Tableau de noms de notes
   * @param {number} [octave=4] - Octave de base
   * @param {number} [duration=1.5] - Durée en secondes
   * @returns {boolean} true si joué avec succès
   */
  playChord(notes, octave = 4, duration = 1.5) {
    if (!this._context || !this._enabled || !Array.isArray(notes)) return false;
    this.resume();

    const now = this._context.currentTime;
    let anyPlayed = false;

    notes.forEach((noteName, index) => {
      // Déterminer l'octave (peut être spécifiée dans le nom)
      let noteOctave = octave;
      if (/\d$/.test(noteName)) {
        noteOctave = parseInt(noteName.slice(-1), 10);
        noteName = noteName.slice(0, -1);
      }

      const frequency = this.getFrequency(noteName, noteOctave);
      if (!frequency) return;

      // Réduire légèrement l'amplitude pour éviter la saturation
      const amplitude = 0.4 / Math.sqrt(notes.length);

      this._createTone(
        frequency,
        'sine',
        now,
        duration,
        0.03,
        0.15,
        amplitude,
        0.2
      );

      anyPlayed = true;
    });

    return anyPlayed;
  },

  /**
   * Joue une séquence de notes
   * @private
   */
  _playMelody(notes, baseTime = null) {
    if (!this._context || !this._enabled) return;

    const startTime = baseTime || this._context.currentTime;

    // Niveau d'une voix : son maintien (défaut 0.3)
    const levelOf = (note) => note.sustain || 0.3;

    // Puissance maximale des voix qui se chevauchent (somme en puissance)
    let maxPower = 0;
    notes.forEach(a => {
      let power = 0;
      notes.forEach(b => {
        if (b.time <= a.time && a.time < b.time + b.duration) power += levelOf(b) ** 2;
      });
      maxPower = Math.max(maxPower, power);
    });
    // Une mélodie dense est atténuée pour garder un niveau homogène entre les sons
    const scale = maxPower > 0 ? Math.min(1, this.MELODY_REFERENCE_LEVEL / Math.sqrt(maxPower)) : 1;

    notes.forEach(note => {
      this._createTone(
        note.freq,
        note.type || 'sine',
        startTime + note.time,
        note.duration,
        note.attack || 0.02,
        note.decay || 0.1,
        levelOf(note) * scale,
        note.release || 0.1
      );
    });
  },

  /**
   * Crée un son de percussion/impact
   * @private
   */
  _playPercussion(frequency, duration, type = 'sine') {
    if (!this._context || !this._enabled) return;

    const t0 = this._context.currentTime;
    const E = this.ENVELOPE;
    const peak = E.peakCeiling;
    const attack = Math.max(E.minAttack, 0.008);
    const tail = E.minRelease;     // retour linéaire à 0 après la décroissance exponentielle

    const osc = this._context.createOscillator();
    const gainNode = this._context.createGain();
    const filter = this._context.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, t0);
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.5, t0 + duration);

    filter.type = 'lowpass';
    filter.frequency.value = 2000;

    // 0 → crête → décroissance exponentielle (jamais 0 : plancher) → 0 avant l'arrêt
    gainNode.gain.setValueAtTime(0, t0);
    gainNode.gain.linearRampToValueAtTime(peak, t0 + attack);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    gainNode.gain.linearRampToValueAtTime(0, t0 + duration + tail);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this._output());

    osc.start(t0);
    osc.stop(t0 + duration + tail + E.stopPad);
  },

  // ═══════════════════════════════════════════════════════════════
  // SONS DU JEU
  // ═══════════════════════════════════════════════════════════════

  /**
   * Son pour carte vers boîte VIOLETTE (réponse incorrecte)
   * Son doux et encourageant - "Ce n'est pas grave, on recommence"
   * Mélodie descendante douce en mineur
   */
  playCardToPurple() {
    if (!this._context || !this._enabled) return;
    this.resume();

    // Mélodie douce descendante (La mineur)
    // Encourage sans décourager
    const notes = [
      { freq: 440, time: 0, duration: 0.2, type: 'sine', sustain: 0.4 },      // La
      { freq: 392, time: 0.15, duration: 0.2, type: 'sine', sustain: 0.35 },  // Sol
      { freq: 349, time: 0.3, duration: 0.35, type: 'sine', sustain: 0.3 },   // Fa
    ];

    // Ajout d'harmoniques douces
    const harmonics = [
      { freq: 220, time: 0, duration: 0.5, type: 'sine', sustain: 0.15 },     // La grave
      { freq: 174, time: 0.3, duration: 0.4, type: 'sine', sustain: 0.1 },    // Fa grave
    ];

    this._playMelody([...notes, ...harmonics]);
  },

  /**
   * Son pour carte vers boîte ORANGE (correct mais lent)
   * Son positif modéré - "Bien, continue comme ça"
   * Mélodie montante simple en majeur
   */
  playCardToOrange() {
    if (!this._context || !this._enabled) return;
    this.resume();

    // Mélodie positive montante (Do majeur)
    const notes = [
      { freq: 262, time: 0, duration: 0.15, type: 'sine', sustain: 0.5 },     // Do
      { freq: 330, time: 0.12, duration: 0.15, type: 'sine', sustain: 0.5 },  // Mi
      { freq: 392, time: 0.24, duration: 0.25, type: 'sine', sustain: 0.4 },  // Sol
    ];

    // Accord final léger
    const chord = [
      { freq: 262, time: 0.35, duration: 0.3, type: 'triangle', sustain: 0.2 },
      { freq: 330, time: 0.35, duration: 0.3, type: 'triangle', sustain: 0.2 },
      { freq: 392, time: 0.35, duration: 0.3, type: 'triangle', sustain: 0.2 },
    ];

    this._playMelody([...notes, ...chord]);
  },

  /**
   * Son pour carte vers boîte VERTE (correct et rapide)
   * Son de célébration - "Excellent ! Parfait !"
   * Fanfare triomphante ascendante (atténuée pour éviter saturation)
   */
  playCardToGreen() {
    if (!this._context || !this._enabled) return;
    this.resume();

    // Fanfare triomphante (Do majeur) - sustain réduit
    const melody = [
      { freq: 262, time: 0, duration: 0.12, type: 'sine', sustain: 0.35 },      // Do
      { freq: 330, time: 0.1, duration: 0.12, type: 'sine', sustain: 0.35 },    // Mi
      { freq: 392, time: 0.2, duration: 0.12, type: 'sine', sustain: 0.35 },    // Sol
      { freq: 523, time: 0.3, duration: 0.3, type: 'sine', sustain: 0.3 },      // Do aigu
    ];

    // Accord final doux
    const chord = [
      { freq: 262, time: 0.3, duration: 0.35, type: 'triangle', sustain: 0.15 },
      { freq: 330, time: 0.3, duration: 0.35, type: 'triangle', sustain: 0.15 },
      { freq: 392, time: 0.3, duration: 0.35, type: 'triangle', sustain: 0.15 },
    ];

    // Brillance légère (moins aiguë)
    const sparkle = [
      { freq: 659, time: 0.4, duration: 0.15, type: 'sine', sustain: 0.1 },   // Mi aigu
    ];

    this._playMelody([...melody, ...chord, ...sparkle]);
  },

  /**
   * Son de pose de carte sur un paquet
   * Petit "thud" satisfaisant
   */
  playCardLand() {
    if (!this._context || !this._enabled) return;
    this.resume();

    this._playPercussion(150, 0.1, 'sine');

    // Petit rebond
    const now = this._context.currentTime;
    this._createTone(200, 'sine', now + 0.08, 0.05, 0.01, 0.02, 0.1, 0.02);
  },

  /**
   * Son de milestone de streak atteint (3, 6, 9, 12, 18, 25, 35, 50, 75, 100)
   * Son progressivement plus épique selon le niveau
   * @param {number} milestone - Palier atteint
   */
  playStreakMilestone(milestone) {
    if (!this._context || !this._enabled) return;
    this.resume();

    // Niveau de célébration selon le milestone
    if (milestone >= 50) {
      this._playMythicStreak();
    } else if (milestone >= 25) {
      this._playLegendaryStreak();
    } else if (milestone >= 12) {
      this._playEpicStreak();
    } else if (milestone >= 6) {
      this._playHotStreak();
    } else {
      this._playActiveStreak();
    }
  },

  /**
   * Streak actif (3) - Encouragement léger
   * @private
   */
  _playActiveStreak() {
    const notes = [
      { freq: 523, time: 0, duration: 0.1, type: 'sine', sustain: 0.5 },       // Do
      { freq: 659, time: 0.08, duration: 0.1, type: 'sine', sustain: 0.5 },    // Mi
      { freq: 784, time: 0.16, duration: 0.15, type: 'sine', sustain: 0.4 },   // Sol
    ];
    this._playMelody(notes);
  },

  /**
   * Streak chaud (6) - Montée d'énergie
   * @private
   */
  _playHotStreak() {
    const melody = [
      { freq: 523, time: 0, duration: 0.08, type: 'sine', sustain: 0.5 },
      { freq: 659, time: 0.06, duration: 0.08, type: 'sine', sustain: 0.5 },
      { freq: 784, time: 0.12, duration: 0.08, type: 'sine', sustain: 0.5 },
      { freq: 1047, time: 0.18, duration: 0.2, type: 'sine', sustain: 0.4 },
    ];
    const sparkle = [
      { freq: 1319, time: 0.25, duration: 0.1, type: 'sine', sustain: 0.2 },
    ];
    this._playMelody([...melody, ...sparkle]);
  },

  /**
   * Streak épique (12) - Fanfare victorieuse
   * @private
   */
  _playEpicStreak() {
    const fanfare = [
      { freq: 392, time: 0, duration: 0.1, type: 'sine', sustain: 0.6 },
      { freq: 494, time: 0.08, duration: 0.1, type: 'sine', sustain: 0.6 },
      { freq: 587, time: 0.16, duration: 0.1, type: 'sine', sustain: 0.6 },
      { freq: 784, time: 0.24, duration: 0.15, type: 'sine', sustain: 0.5 },
      { freq: 988, time: 0.35, duration: 0.25, type: 'sine', sustain: 0.4 },
    ];
    const chord = [
      { freq: 392, time: 0.35, duration: 0.3, type: 'triangle', sustain: 0.2 },
      { freq: 494, time: 0.35, duration: 0.3, type: 'triangle', sustain: 0.2 },
      { freq: 587, time: 0.35, duration: 0.3, type: 'triangle', sustain: 0.2 },
    ];
    this._playMelody([...fanfare, ...chord]);
  },

  /**
   * Streak légendaire (25) - Triomphe orchestral
   * @private
   */
  _playLegendaryStreak() {
    const herald = [
      { freq: 523, time: 0, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 659, time: 0.1, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 784, time: 0.2, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 1047, time: 0.3, duration: 0.15, type: 'sine', sustain: 0.5 },
      { freq: 1319, time: 0.4, duration: 0.3, type: 'sine', sustain: 0.4 },
    ];
    const bass = [
      { freq: 131, time: 0.3, duration: 0.5, type: 'triangle', sustain: 0.25 },
      { freq: 165, time: 0.3, duration: 0.5, type: 'triangle', sustain: 0.2 },
    ];
    const shimmer = [
      { freq: 2093, time: 0.5, duration: 0.15, type: 'sine', sustain: 0.1 },
      { freq: 1760, time: 0.6, duration: 0.15, type: 'sine', sustain: 0.1 },
      { freq: 2093, time: 0.7, duration: 0.2, type: 'sine', sustain: 0.1 },
    ];
    this._playMelody([...herald, ...bass, ...shimmer]);
  },

  /**
   * Streak mythique (50+) - Apothéose majestueuse
   * @private
   */
  _playMythicStreak() {
    // Intro majestueuse
    const intro = [
      { freq: 262, time: 0, duration: 0.15, type: 'sine', sustain: 0.5 },
      { freq: 330, time: 0.1, duration: 0.15, type: 'sine', sustain: 0.5 },
      { freq: 392, time: 0.2, duration: 0.15, type: 'sine', sustain: 0.5 },
    ];
    // Montée épique
    const rise = [
      { freq: 523, time: 0.35, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 659, time: 0.45, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 784, time: 0.55, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 1047, time: 0.65, duration: 0.15, type: 'sine', sustain: 0.5 },
      { freq: 1319, time: 0.75, duration: 0.15, type: 'sine', sustain: 0.5 },
      { freq: 1568, time: 0.85, duration: 0.4, type: 'sine', sustain: 0.4 },
    ];
    // Accord majestueux
    const chord = [
      { freq: 262, time: 0.85, duration: 0.5, type: 'triangle', sustain: 0.3 },
      { freq: 330, time: 0.85, duration: 0.5, type: 'triangle', sustain: 0.25 },
      { freq: 392, time: 0.85, duration: 0.5, type: 'triangle', sustain: 0.25 },
      { freq: 523, time: 0.85, duration: 0.5, type: 'triangle', sustain: 0.2 },
    ];
    // Brillance finale
    const sparkle = [
      { freq: 2093, time: 1.0, duration: 0.1, type: 'sine', sustain: 0.15 },
      { freq: 2637, time: 1.1, duration: 0.1, type: 'sine', sustain: 0.1 },
      { freq: 3136, time: 1.2, duration: 0.15, type: 'sine', sustain: 0.08 },
    ];
    this._playMelody([...intro, ...rise, ...chord, ...sparkle]);
  },

  /**
   * Son de montée de niveau
   * Fanfare célébratoire avec progression ascendante
   */
  playLevelUp() {
    if (!this._context || !this._enabled) return;
    this.resume();

    const fanfare = [
      { freq: 392, time: 0, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 494, time: 0.1, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 587, time: 0.2, duration: 0.12, type: 'sine', sustain: 0.6 },
      { freq: 784, time: 0.3, duration: 0.2, type: 'sine', sustain: 0.5 },
    ];
    const triumph = [
      { freq: 784, time: 0.45, duration: 0.1, type: 'sine', sustain: 0.5 },
      { freq: 988, time: 0.52, duration: 0.1, type: 'sine', sustain: 0.5 },
      { freq: 1175, time: 0.59, duration: 0.35, type: 'sine', sustain: 0.4 },
    ];
    const bass = [
      { freq: 196, time: 0.3, duration: 0.7, type: 'triangle', sustain: 0.2 },
      { freq: 294, time: 0.45, duration: 0.55, type: 'triangle', sustain: 0.15 },
    ];
    const sparkle = [
      { freq: 1568, time: 0.7, duration: 0.12, type: 'sine', sustain: 0.12 },
      { freq: 2093, time: 0.8, duration: 0.15, type: 'sine', sustain: 0.1 },
    ];

    this._playMelody([...fanfare, ...triumph, ...bass, ...sparkle]);
  },

  /**
   * Son de badge débloqué
   * Fanfare spéciale
   */
  playBadgeUnlocked() {
    if (!this._context || !this._enabled) return;
    this.resume();

    const fanfare = [
      { freq: 392, time: 0, duration: 0.1, type: 'sine', sustain: 0.6 },
      { freq: 494, time: 0.08, duration: 0.1, type: 'sine', sustain: 0.6 },
      { freq: 587, time: 0.16, duration: 0.1, type: 'sine', sustain: 0.6 },
      { freq: 784, time: 0.24, duration: 0.4, type: 'sine', sustain: 0.5 },
    ];

    const shimmer = [
      { freq: 1568, time: 0.3, duration: 0.15, type: 'sine', sustain: 0.1 },
      { freq: 1175, time: 0.4, duration: 0.15, type: 'sine', sustain: 0.1 },
      { freq: 1568, time: 0.5, duration: 0.2, type: 'sine', sustain: 0.1 },
    ];

    const bass = [
      { freq: 196, time: 0.24, duration: 0.5, type: 'triangle', sustain: 0.15 },
      { freq: 294, time: 0.24, duration: 0.5, type: 'triangle', sustain: 0.15 },
    ];

    this._playMelody([...fanfare, ...shimmer, ...bass]);
  },

  /**
   * Joue le son approprié pour une boîte
   * @param {string} box - 'purple', 'orange', ou 'green'
   */
  playCardToBox(box) {
    switch (box) {
      case 'purple':
        this.playCardToPurple();
        break;
      case 'orange':
        this.playCardToOrange();
        break;
      case 'green':
        this.playCardToGreen();
        break;
      default:
        this.playCardLand();
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Audio;
}
