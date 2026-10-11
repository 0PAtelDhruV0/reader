(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const synth = window.speechSynthesis;
  const canSpeak = Boolean(synth && window.SpeechSynthesisUtterance);
  let passage = null, utterance = null, playback = 'stopped', translateSeq = 0;
  let lastSelected = null;
  const cache = new Map();

  // Useful immediate/offline meanings; other words use a free online dictionary/translator.
  const dictionary = {
    'le':'the (masculine)','la':'the (feminine)','les':'the (plural)','un':'a / one (masculine)',
    'une':'a / one (feminine)','des':'some','du':'some / of the','de':'of / from','à':'to / at',
    'au':'to the','aux':'to the (plural)','et':'and','ou':'or','mais':'but','donc':'so / therefore',
    'car':'because','pour':'for / to','par':'by','avec':'with','sans':'without','dans':'in',
    'sur':'on','sous':'under','entre':'between','vers':'toward','chez':'at the home of',
    'avant':'before','après':'after','pendant':'during','depuis':'since','jusque':'until',
    'il':'he / it','elle':'she / it','ils':'they (masculine/mixed)','elles':'they (feminine)',
    'je':'I','tu':'you (informal)','vous':'you (formal/plural)','nous':'we','on':'one / we / people',
    'me':'me','te':'you','se':'oneself','leur':'their / to them','leurs':'their (plural)',
    'son':'his / her / its','sa':'his / her / its','ses':'his / her / its (plural)',
    'mon':'my','ma':'my','mes':'my (plural)','notre':'our','nos':'our (plural)',
    'ce':'this / that','cet':'this (before vowel)','cette':'this (feminine)','ces':'these',
    'qui':'who / which','que':'that / what','quoi':'what','où':'where','quand':'when',
    'comment':'how','pourquoi':'why','combien':'how many / how much','quel':'which / what',
    'quelle':'which / what','quels':'which (plural)','quelles':'which (feminine plural)',
    'est':'is','sont':'are','être':'to be','été':'been / summer','était':'was','étaient':'were',
    'avoir':'to have','a':'has','ont':'have','avait':'had','avaient':'had','fait':'does / made',
    'faire':'to do / make','peut':'can','peuvent':'can','pouvoir':'to be able to',
    'faut':'must / necessary','doit':'must / has to','doivent':'must / have to',
    'plus':'more / no longer','moins':'less','très':'very','trop':'too much',
    'bien':'well / good','mal':'badly','souvent':'often','toujours':'always / still',
    'parfois':'sometimes','rarement':'rarely','jamais':'never / ever','encore':'still / again',
    'déjà':'already','aussi':'also','seulement':'only','simplement':'simply','même':'same / even',
    'autre':'other','autres':'others','beaucoup':'a lot','peu':'little / few',
    'petit':'small','petite':'small','petits':'small (plural)','grande':'big / great',
    'grand':'big / tall','grands':'big (plural)','nouveau':'new','nouvelle':'new',
    'jour':'day','jours':'days','semaine':'week','semaines':'weeks','mois':'month / months',
    'année':'year','années':'years','matin':'morning','soir':'evening','temps':'time / weather',
    'heure':'hour','heures':'hours','moment':'moment','moments':'moments',
    'personne':'person / nobody','personnes':'people','enfants':'children',
    'amis':'friends','ami':'friend','famille':'family','voisins':'neighbors',
    'ville':'city','rue':'street','maison':'house / home','travail':'work',
    'école':'school','bibliothèque':'library','livre':'book','livres':'books',
    'histoire':'story / history','histoires':'stories','mots':'words','mot':'word',
    'langue':'language','français':'French','anglais':'English','apprendre':'to learn',
    'parler':'to speak','écouter':'to listen','lire':'to read','écrire':'to write',
    'regarder':'to watch / look at','comprendre':'to understand','découvrir':'to discover',
    'choisir':'to choose','changer':'to change','aider':'to help','partager':'to share',
    'ensemble':'together','important':'important','importante':'important',
    'possibilité':'possibility','possible':'possible','différent':'different',
    'différents':'different (plural)','différentes':'different (feminine plural)',
    'voyage':'trip / journey','train':'train','repas':'meal','cuisine':'cooking / kitchen',
    'cuisiner':'to cook','jardin':'garden','plantes':'plants','plante':'plant','eau':'water',
    'téléphone':'phone','écran':'screen','ordinateur':'computer','musique':'music',
    'route':'road / route','vélo':'bicycle','voiture':'car','bus':'bus','quartier':'neighborhood',
    'culture':'culture','cultures':'cultures','tradition':'tradition','souvenir':'memory',
    'souvenirs':'memories','confiance':'trust / confidence','effort':'effort','choix':'choice',
    'attention':'attention','patience':'patience','petite':'small','vie':'life',
    'vrai':'true','vraie':'true','vraiment':'really','presque':'almost','chaque':'each / every',
    'certaines':'some (feminine plural)','certains':'some (masculine plural)','ainsi':'thus / in this way',
    'alors':'then / so','pourtant':'however','cependant':'however','finalement':'finally',
    'lorsque':'when','grâce':'thanks','leur':'their / to them', 'l’on':'we / people'
  };

  function setAudioState(state) {
    playback = state;
    $('audioStatus').textContent = state === 'playing' ? 'Playing French narration…' : state === 'paused' ? 'Paused' : 'Ready when you are';
    $('playText').textContent = state === 'paused' ? 'Resume' : 'Play';
    $('pause').disabled = state !== 'playing';
    $('stop').disabled = state === 'stopped';
  }

  function stopAudio() {
    if (canSpeak) synth.cancel();
    utterance = null;
    setAudioState('stopped');
  }

  function playAudio() {
    if (!passage || !canSpeak) return;
    if (playback === 'playing') return;
    if (playback === 'paused') {
      try { synth.resume(); setAudioState('playing'); } catch (_) { stopAudio(); }
      return;
    }
    stopAudio();
    const words = passage.paragraphs.map(p => p.fr).join(' ');
    const u = new SpeechSynthesisUtterance(words);
    u.lang = 'fr-FR'; u.rate = 0.88; u.pitch = 1; u.volume = 1;
    // Prefer a native installed French voice when available.
    const voices = synth.getVoices();
    const voice = voices.find(v => /^fr[-_]/i.test(v.lang) && v.localService) || voices.find(v => /^fr[-_]/i.test(v.lang));
    if (voice) u.voice = voice;
    utterance = u;
    u.onend = () => { if (utterance === u) { utterance = null; setAudioState('stopped'); } };
    u.onerror = event => {
      if (utterance !== u) return;
      utterance = null;
      setAudioState('stopped');
      if (event.error !== 'canceled' && event.error !== 'interrupted') $('audioStatus').textContent = 'Voice unavailable on this device';
    };
    setAudioState('playing');
    // Safari/iPad requires speech to be triggered by a user click.
    synth.speak(u);
  }

  function tokenize(text, parent) {
    const re = /[\p{L}\p{M}]+(?:['’\-][\p{L}\p{M}]+)*/gu;
    let cursor = 0;
    for (const match of text.matchAll(re)) {
      const index = match.index;
      if (index > cursor) parent.append(document.createTextNode(text.slice(cursor, index)));
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'word'; b.textContent = match[0];
      b.setAttribute('aria-label', `Meaning of ${match[0]}`);
      b.addEventListener('click', () => showWord(match[0], b));
      parent.append(b);
      cursor = index + match[0].length;
    }
    if (cursor < text.length) parent.append(document.createTextNode(text.slice(cursor)));
  }

  function render(data) {
    if (!data || !Array.isArray(data.paragraphs) || !data.paragraphs.every(p => typeof p.fr === 'string' && typeof p.en === 'string')) throw new Error('Invalid passage');
    if (passage && passage.id === data.id) return false;
    stopAudio(); closeWord(); passage = data;
    $('essayTitle').textContent = data.title;
    $('essaySubtitle').textContent = data.title_en || 'New French passage';
    $('level').textContent = data.level || 'French';
    $('length').textContent = `${data.word_count || data.paragraphs.map(x => x.fr.split(/\s+/).length).reduce((a,b) => a+b,0)} words · ${data.paragraphs.length} short paragraphs`;
    const fr = document.createDocumentFragment();
    const en = document.createDocumentFragment();
    for (const part of data.paragraphs) {
      const frenchPara = document.createElement('p'); tokenize(part.fr, frenchPara); fr.append(frenchPara);
      const englishPara = document.createElement('p'); englishPara.textContent = part.en; en.append(englishPara);
    }
    $('passage').replaceChildren(fr); $('english').replaceChildren(en);
    $('frenchScroll').scrollTop = 0;
    $('englishScroll').scrollTop = 0;
    document.title = `Reader — ${data.title}`;
    return true;
  }

  function closeWord() {
    translateSeq++;
    $('wordSheet').hidden = true;
    if (lastSelected) lastSelected.classList.remove('selected');
    lastSelected = null;
  }

  function normalize(word) { return word.trim().toLocaleLowerCase('fr').replace(/[’]/g, "'"); }

  async function showWord(word, button) {
    // First operation: stop any audio immediately, even before network requests.
    stopAudio();
    const seq = ++translateSeq;
    if (lastSelected) lastSelected.classList.remove('selected');
    lastSelected = button; button.classList.add('selected');
    $('wordSheet').hidden = false;
    $('selectedWord').textContent = word;
    const key = normalize(word);
    const builtin = dictionary[key] || cache.get(key);
    if (builtin) { $('wordMeaning').textContent = builtin; return; }
    $('wordMeaning').textContent = 'Finding English meaning…';
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=fr%7Cen`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8500);
      let result;
      try { result = await fetch(url, { signal: controller.signal }); } finally { clearTimeout(timeout); }
      if (!result.ok) throw new Error('Not available');
      const data = await result.json();
      const meaning = data.responseData && typeof data.responseData.translatedText === 'string' ? data.responseData.translatedText.trim() : '';
      if (!meaning || /^QUERY LENGTH LIMIT|^MYMEMORY WARNING/i.test(meaning)) throw new Error('No translation');
      cache.set(key, meaning);
      if (translateSeq === seq) $('wordMeaning').textContent = meaning;
    } catch (_) {
      if (translateSeq === seq) $('wordMeaning').textContent = 'Meaning unavailable right now. Please check your connection or use the paragraph translation.';
    }
  }

  async function refresh(silent = false) {
    const btn = $('refresh');
    btn.disabled = true;
    try {
      // Cache-busting ensures an old CDN/browser cached passage isn't reused.
      const resp = await fetch(`current.json?fresh=${Date.now()}`, { cache: 'no-store' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const changed = render(data);
      try { localStorage.setItem('parlez-current', JSON.stringify(data)); } catch (_) { /* optional cache */ }
      const hourLabel = data.hour_utc ? new Date(data.hour_utc).toLocaleString(undefined, { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' }) : 'recently';
      $('freshness').textContent = `${changed ? 'Latest passage loaded' : 'You have the latest passage'} · ${hourLabel}`;
    } catch (_) {
      if (!passage) {
        try { const old = localStorage.getItem('parlez-current'); if (old) render(JSON.parse(old)); } catch (_) { /* ignore */ }
      }
      $('freshness').textContent = passage ? 'Offline · showing last saved passage' : 'Unable to load passage. Tap refresh to retry.';
    } finally { btn.disabled = false; }
  }

  $('play').addEventListener('click', playAudio);
  $('pause').addEventListener('click', () => {
    if (canSpeak && playback === 'playing') { synth.pause(); setAudioState('paused'); }
  });
  $('stop').addEventListener('click', stopAudio);
  $('closeWord').addEventListener('click', closeWord);
  $('refresh').addEventListener('click', () => refresh());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(true); });
  window.addEventListener('pagehide', stopAudio);
  if (!canSpeak) {
    $('play').disabled = true; $('pause').disabled = true; $('stop').disabled = true;
    $('audioStatus').textContent = 'This browser does not support speech audio';
  } else setAudioState('stopped');
  refresh();
  // An already-open tab also checks for a new passage periodically.
  setInterval(() => { if (!document.hidden) refresh(true); }, 5 * 60 * 1000);
})();