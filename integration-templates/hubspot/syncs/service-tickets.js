var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default function fetchData(nango) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const MAX_PAGE = 100;
        const TICKET_PROPERTIES = ['hubspot_owner_id', 'hs_pipeline', 'hs_pipeline_stage', 'hs_ticket_priority', 'hs_ticket_category', 'subject', 'content'];
        let afterLink = null;
        const lastSyncDate = (_a = nango.lastSyncDate) === null || _a === void 0 ? void 0 : _a.toISOString().slice(0, -8).replace('T', ' ');
        const queryDate = lastSyncDate ? Date.parse(lastSyncDate) : Date.now() - 86400000;
        while (true) {
            const payload = {
                endpoint: '/crm/v3/objects/tickets/search',
                data: {
                    sorts: [{ propertyName: 'hs_lastmodifieddate', direction: 'DESCENDING' }],
                    properties: TICKET_PROPERTIES,
                    filterGroups: [{ filters: [{ propertyName: 'hs_lastmodifieddate', operator: 'GT', value: queryDate }] }],
                    limit: `${MAX_PAGE}`,
                    after: afterLink
                }
            };
            try {
                const response = yield nango.post(payload);
                const pageData = response.data.results;
                const mappedTickets = pageData.map((ticket) => {
                    const { id, createdAt, archived } = ticket;
                    const { subject, content, hs_object_id, hubspot_owner_id, hs_pipeline, hs_pipeline_stage, hs_ticket_category, hs_ticket_priority } = ticket.properties;
                    return {
                        id,
                        createdAt,
                        updatedAt: ticket.properties.hs_lastmodifieddate,
                        archived,
                        subject,
                        content,
                        objectId: hs_object_id,
                        ownerId: hubspot_owner_id,
                        pipelineName: hs_pipeline,
                        pipelineStage: hs_pipeline_stage,
                        category: hs_ticket_category,
                        priority: hs_ticket_priority
                    };
                });
                if (mappedTickets.length > 0) {
                    yield nango.batchSave(mappedTickets, 'HubspotServiceTicket');
                    yield nango.log(`Sent ${mappedTickets.length}`);
                }
                if ((_c = (_b = response.data.paging) === null || _b === void 0 ? void 0 : _b.next) === null || _c === void 0 ? void 0 : _c.after) {
                    afterLink = response.data.paging.next.after;
                }
                else {
                    break;
                }
            }
            catch (error) {
                throw new Error(`Error in fetchData: ${error.message}`);
            }
        }
    });
}
//# sourceMappingURL=service-tickets.js.map