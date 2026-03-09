export function generateUsername(options = {}) {
  const defaultOptions = {
    prefix: 'user',
    length: 8,
    useWords: false,
    useNumbers: true
  };

  const config = { ...defaultOptions, ...options };
  let result = '';

  if (config.useWords) {
    const adjectives = ['swift', 'clever', 'brave', 'silent', 'happy', 'lucky', 'cool', 'smart', 'witty', 'bright', 'calm', 'eager', 'gentle', 'proud', 'shiny', 'vast'];
    const nouns = ['tiger', 'eagle', 'wolf', 'fox', 'bear', 'panda', 'lion', 'hawk', 'river', 'ocean', 'star', 'moon', 'sun', 'comet', 'planet', 'galaxy'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    result = `${adj}_${noun}`;

    if (config.useNumbers) {
      result += '_' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    }
  } else {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let pool = chars;
    if (config.useNumbers) {
      pool += numbers;
    }

    let randomString = '';
    for (let i = 0; i < config.length; i++) {
      randomString += pool.charAt(Math.floor(Math.random() * pool.length));
    }

    result = config.prefix ? `${config.prefix}_${randomString}` : randomString;
  }

  return result;
}
