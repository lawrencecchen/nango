var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function getZendeskSubdomain(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield nango.getConnection();
        return response.connection_config['subdomain'];
    });
}
export default function fetchData(nango) {
    return __awaiter(this, void 0, void 0, function* () {
        const subdomain = yield getZendeskSubdomain(nango);
        let content = null;
        while (true) {
            content = yield paginate(nango, 'get', '/api/v2/tickets', content, 2, subdomain);
            if (!(content === null || content === void 0 ? void 0 : content.tickets)) {
                break;
            }
            const ZendeskTickets = mapZendeskTickets(content.tickets);
            yield nango.batchSave(ZendeskTickets, 'ZendeskTicket');
            if (!content.has_more) {
                break;
            }
        }
    });
}
function paginate(nango, method, endpoint, contentPage, pageSize = 250, subdomain) {
    return __awaiter(this, void 0, void 0, function* () {
        if (contentPage && !contentPage.has_more) {
            return null;
        }
        yield nango.log(`Fetching Zendesk Tickets - with pageCounter = ${contentPage ? contentPage.pageNumber : 0} & pageSize = ${pageSize}`);
        const res = yield nango.get({
            baseUrlOverride: `https://${subdomain}.zendesk.com`,
            endpoint: contentPage ? contentPage.nextPageEndpoint : endpoint,
            method: method,
            params: { 'page[size]': `${pageSize}` },
            retries: 10 // Exponential backoff + long-running job = handles rate limits well.
        });
        if (!res.data) {
            return null;
        }
        const content = {
            pageNumber: contentPage ? contentPage.pageNumber + 1 : 1,
            tickets: res.data.tickets,
            has_more: res.data.meta.has_more,
            nextPageEndpoint: res.data.meta.has_more ? `${endpoint}?page[size]=${pageSize}&page[after]=${res.data['meta'].after_cursor}` : '',
            totalResultCount: contentPage ? contentPage.totalResultCount + res.data.tickets.length : res.data.tickets.length
        };
        yield nango.log(`Saving page with ${content.tickets.length} records (total records: ${content.totalResultCount})`);
        return content;
    });
}
function mapZendeskTickets(tickets) {
    return tickets.map((ticket) => {
        return {
            requester_id: ticket.requester_id,
            allow_attachments: ticket.allow_attachments,
            allow_channelback: ticket.allow_channelback,
            assignee_email: ticket.assignee_email,
            assignee_id: ticket.assignee_id,
            attribute_value_ids: ticket.attribute_value_ids,
            brand_id: ticket.brand_id,
            collaborator_ids: ticket.collaborator_ids,
            collaborators: ticket.collaborators,
            comment: ticket.comment,
            created_at: ticket.created_at,
            custom_fields: ticket.custom_fields,
            custom_status_id: ticket.custom_status_id,
            description: ticket.description,
            due_at: ticket.due_at,
            email_cc_ids: ticket.email_cc_ids,
            email_ccs: ticket.email_ccs,
            external_id: ticket.external_id,
            follower_ids: ticket.follower_ids,
            followers: ticket.followers,
            followup_ids: ticket.followup_ids,
            forum_topic_id: ticket.forum_topic_id,
            from_messaging_channel: ticket.from_messaging_channel,
            group_id: ticket.group_id,
            has_incidents: ticket.has_incidents,
            id: ticket.id,
            is_public: ticket.is_public,
            macro_id: ticket.macro_id,
            macro_ids: ticket.macro_ids,
            metadata: ticket.metadata,
            organization_id: ticket.organization_id,
            priority: ticket.priority,
            problem_id: ticket.problem_id,
            raw_subject: ticket.raw_subject,
            recipient: ticket.recipient,
            requester: ticket.requester,
            safe_update: ticket.safe_update,
            satisfaction_rating: ticket.satisfaction_rating,
            sharing_agreement_ids: ticket.sharing_agreement_ids,
            status: ticket.status,
            subject: ticket.subject,
            submitter_id: ticket.submitter_id,
            tags: ticket.tags,
            ticket_form_id: ticket.ticket_form_id,
            type: ticket.type,
            updated_at: ticket.updated_at,
            updated_stamp: ticket.updated_stamp,
            url: ticket.url,
            via: ticket.via,
            via_followup_source_id: ticket.via_followup_source_id,
            via_id: ticket.via_id,
            voice_comment: ticket.voice_comment
        };
    });
}
//# sourceMappingURL=tickets.js.map