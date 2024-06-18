import type { NangoSync, GoogleCalendar } from '../../types/lib/integration/asana.js';

export default async function fetchData(nango: NangoSync): Promise<void> {
    const maxResults = '100';

    for await (const eventPage of nango.paginate<GoogleCalendar>({ endpoint: 'calendar/v3/users/me/calendarList', params: { maxResults } })) {
        await nango.batchSave<GoogleCalendar>(eventPage, 'GoogleCalendar');
    }
}
