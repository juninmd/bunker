export interface PasswordOptions {
    uppercase?: boolean;
    lowercase?: boolean;
    numbers?: boolean;
    symbols?: boolean;
}

export function generatePassword(length = 16, options: PasswordOptions = {}): string {
    const {
        uppercase = true,
        lowercase = true,
        numbers = true,
        symbols = true
    } = options;

    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let allowedChars = '';
    const guaranteedChars: string[] = [];

    if (uppercase) {
        allowedChars += charSets.uppercase;
        guaranteedChars.push(getRandomChar(charSets.uppercase));
    }
    if (lowercase) {
        allowedChars += charSets.lowercase;
        guaranteedChars.push(getRandomChar(charSets.lowercase));
    }
    if (numbers) {
        allowedChars += charSets.numbers;
        guaranteedChars.push(getRandomChar(charSets.numbers));
    }
    if (symbols) {
        allowedChars += charSets.symbols;
        guaranteedChars.push(getRandomChar(charSets.symbols));
    }

    if (allowedChars.length === 0) {
        throw new Error('At least one character set must be selected');
    }

    // Ensure length is at least the number of selected types
    if (length < guaranteedChars.length) {
        length = guaranteedChars.length;
    }

    let passwordArray = [...guaranteedChars];

    // Fill the rest
    while (passwordArray.length < length) {
        passwordArray.push(getRandomChar(allowedChars));
    }

    // Shuffle the result to avoid predictable patterns (e.g. guaranteed chars at start)
    return shuffleArray(passwordArray).join('');
}

function getRandomChar(charSet: string): string {
    if (!charSet) {
        throw new Error('Character set cannot be empty');
    }

    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const randomValue = array[0] ?? 0;
    const char = charSet[randomValue % charSet.length];
    if (!char) {
        throw new Error('Failed to generate random character');
    }
    return char;
}

function shuffleArray(array: string[]): string[] {
    for (let i = array.length - 1; i > 0; i--) {
        const rand = new Uint32Array(1);
        crypto.getRandomValues(rand);
        const randomValue = rand[0] ?? 0;
        const j = randomValue % (i + 1);
        const current = array[i];
        const target = array[j];
        if (current === undefined || target === undefined) {
            continue;
        }
        [array[i], array[j]] = [target, current];
    }
    return array;
}

export function generateUsername(length = 12): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const allowedChars = letters + numbers;

    if (length < 1) {
        throw new Error('Length must be at least 1');
    }

    let username = getRandomChar(letters); // First character must be a letter

    for (let i = 1; i < length; i++) {
        username += getRandomChar(allowedChars);
    }

    return username;
}
