import { getGreeting } from './helper.js';
import { otherWelcome } from '../../../welcomer.js';

export default function runAction(): string {
    otherWelcome();
    return getGreeting();
}
