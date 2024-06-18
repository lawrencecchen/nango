import { getGreeting } from './helper.js';

export default function runAction(): string | number {
    return getGreeting();
}
