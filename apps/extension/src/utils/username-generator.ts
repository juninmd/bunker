export interface UsernameOptions {
  prefix?: string;
  length?: number;
  useWords?: boolean;
  useNumbers?: boolean;
}

export function generateUsername(options: UsernameOptions = {}): string {
  const defaultOptions = {
    prefix: 'user',
    length: 8,
    useWords: false,
    useNumbers: true
  };

  const config = { ...defaultOptions, ...options };
  let result = '';

  const randArray = new Uint32Array(1);

  function getSecureRandom(max: number): number {
    crypto.getRandomValues(randArray);
    return randArray[0]! % max;
  }

  if (config.useWords) {
    const adjectives = ['swift', 'clever', 'brave', 'silent', 'happy', 'lucky', 'cool', 'smart', 'witty', 'bright', 'calm', 'eager', 'gentle', 'proud', 'shiny', 'vast'];
    const nouns = ['tiger', 'eagle', 'wolf', 'fox', 'bear', 'panda', 'lion', 'hawk', 'river', 'ocean', 'star', 'moon', 'sun', 'comet', 'planet', 'galaxy'];
    const adj = adjectives[getSecureRandom(adjectives.length)] as string;
    const noun = nouns[getSecureRandom(nouns.length)] as string;
    result = `${adj}_${noun}`;

    if (config.useNumbers) {
      result += '_' + getSecureRandom(10000).toString().padStart(4, '0');
    }
  } else {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    let pool = chars;
    if (config.useNumbers) {
      pool += numbers;
    }

    let randomString = '';
    for (let i = 0; i < (config.length ?? 8); i++) {
      randomString += pool.charAt(getSecureRandom(pool.length));
    }

    result = config.prefix ? `${config.prefix}_${randomString}` : randomString;
  }

  return result;
}
