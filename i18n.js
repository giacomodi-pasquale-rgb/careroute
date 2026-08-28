const copy = {
  en: {
    pilot: 'Northeast pilot', safety: '<strong>Not medical advice.</strong> If someone may have a life-threatening emergency, call <a href="tel:911">911</a> now.',
    eyebrow: 'Adult & child care navigation', heroTitle: 'Find the right level of care—without the guesswork.',
    heroBody: 'Compare verified care options for adults and children in the growing Northeast pilot network. CareRoute filters by patient group, care setting, access needs, and published capabilities, then adds driving time when you share your location.',
    routeTitle: 'Route from where you are?', accessTitle: 'What would make care easier to access?', accessHelper: 'Optional. Select everything that matters today.',
    accessUninsured: 'I do not have insurance', accessLowCost: 'I need free or reduced-cost care', accessLanguage: 'I need language support',
    locationPrivacy: 'Your precise location is used only in this browser to request driving times. It is not stored by CareRoute.',
    step1: 'Who needs care?', step2: 'What kind of concern?', step3: 'Could this be an emergency?', step4: 'Access and location'
  },
  es: {
    pilot: 'Programa piloto del noreste', safety: '<strong>No es consejo médico.</strong> Si alguien puede tener una emergencia que amenaza su vida, llame al <a href="tel:911">911</a> ahora.',
    eyebrow: 'Navegación de atención para adultos y niños', heroTitle: 'Encuentre el nivel de atención adecuado, sin adivinar.',
    heroBody: 'Compare opciones de atención verificadas para adultos y niños. CareRoute considera el grupo de edad, el tipo de atención, las necesidades de acceso y las capacidades publicadas, y agrega el tiempo de viaje cuando comparte su ubicación.',
    routeTitle: '¿Usar su ubicación para calcular la ruta?', accessTitle: '¿Qué facilitaría el acceso a la atención?', accessHelper: 'Opcional. Seleccione todo lo que sea importante hoy.',
    accessUninsured: 'No tengo seguro médico', accessLowCost: 'Necesito atención gratuita o de costo reducido', accessLanguage: 'Necesito ayuda en otro idioma',
    locationPrivacy: 'Su ubicación precisa se usa solamente en este navegador para calcular el viaje. CareRoute no la almacena.',
    step1: '¿Quién necesita atención?', step2: '¿Qué tipo de problema tiene?', step3: '¿Podría ser una emergencia?', step4: 'Acceso y ubicación'
  },
  pt: {
    pilot: 'Piloto do Nordeste', safety: '<strong>Não é orientação médica.</strong> Se alguém pode estar em uma emergência com risco de vida, ligue para <a href="tel:911">911</a> agora.',
    eyebrow: 'Navegação de cuidados para adultos e crianças', heroTitle: 'Encontre o nível certo de atendimento, sem adivinhação.',
    heroBody: 'Compare opções verificadas de atendimento para adultos e crianças. O CareRoute considera faixa etária, tipo de atendimento, necessidades de acesso e capacidades publicadas, e adiciona o tempo de viagem quando você compartilha sua localização.',
    routeTitle: 'Usar sua localização para calcular a rota?', accessTitle: 'O que facilitaria o acesso ao atendimento?', accessHelper: 'Opcional. Selecione tudo o que importa hoje.',
    accessUninsured: 'Não tenho seguro de saúde', accessLowCost: 'Preciso de atendimento gratuito ou com custo reduzido', accessLanguage: 'Preciso de apoio em outro idioma',
    locationPrivacy: 'Sua localização exata é usada apenas neste navegador para calcular o trajeto. O CareRoute não a armazena.',
    step1: 'Quem precisa de atendimento?', step2: 'Qual é o tipo de preocupação?', step3: 'Pode ser uma emergência?', step4: 'Acesso e localização'
  },
  ht: {
    pilot: 'Pilòt Nòdès la', safety: '<strong>Sa pa ranplase konsèy medikal.</strong> Si yon moun ka gen yon ijans ki menase lavi li, rele <a href="tel:911">911</a> kounye a.',
    eyebrow: 'Oryantasyon swen pou granmoun ak timoun', heroTitle: 'Jwenn bon nivo swen an san devine.',
    heroBody: 'Konpare opsyon swen verifye pou granmoun ak timoun. CareRoute konsidere gwoup laj, kalite swen, bezwen aksè ak sèvis ki pibliye, epi li ajoute tan kondwi lè ou pataje kote ou ye a.',
    routeTitle: 'Sèvi ak kote ou ye a pou kalkile wout la?', accessTitle: 'Kisa ki ta fè swen pi fasil pou jwenn?', accessHelper: 'Opsyonèl. Chwazi tout sa ki enpòtan jodi a.',
    accessUninsured: 'Mwen pa gen asirans sante', accessLowCost: 'Mwen bezwen swen gratis oswa a pri redui', accessLanguage: 'Mwen bezwen sipò nan yon lòt lang',
    locationPrivacy: 'Yo sèvi ak kote egzak ou sèlman nan navigatè sa a pou kalkile tan kondwi. CareRoute pa konsève li.',
    step1: 'Kiyès ki bezwen swen?', step2: 'Ki kalite pwoblèm?', step3: 'Èske sa ka yon ijans?', step4: 'Aksè ak kote'
  }
};

let current = 'en';

export function t(key) { return copy[current]?.[key] || copy.en[key] || key; }

export function setLanguage(language) {
  current = copy[language] ? language : 'en';
  document.documentElement.lang = current;
  document.querySelectorAll('[data-i18n]').forEach((element) => { element.innerHTML = t(element.dataset.i18n); });
  localStorage.setItem('careroute-language', current);
  document.dispatchEvent(new CustomEvent('careroute:language', { detail: current }));
}

export function initLanguage() {
  const select = document.getElementById('languageSelect');
  const saved = localStorage.getItem('careroute-language');
  const preferred = copy[saved] ? saved : (copy[navigator.language?.slice(0, 2)] ? navigator.language.slice(0, 2) : 'en');
  select.value = preferred;
  select.addEventListener('change', () => setLanguage(select.value));
  setLanguage(preferred);
}
