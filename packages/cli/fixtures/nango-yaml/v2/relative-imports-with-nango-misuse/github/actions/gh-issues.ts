import { getGreeting } from './helper.js';
import { otherWelcome } from './welcomer.js';

export default function runAction(nango: any): string {
    otherWelcome(nango);
    return getGreeting();
}
