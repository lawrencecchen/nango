import type { NangoSync } from './models.js';

export default async function fetchAddress(nango: NangoSync) {
    return nango.get({ endpoint: '/customer/addressBook' });
}
