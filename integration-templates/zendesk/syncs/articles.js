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
            content = yield paginate(nango, 'get', '/api/v2/help_center/en-us/articles', content, 2, subdomain);
            if (!(content === null || content === void 0 ? void 0 : content.articles)) {
                break;
            }
            const ZendeskArticles = mapZendeskArticles(content.articles);
            yield nango.batchSave(ZendeskArticles, 'ZendeskArticle');
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
            articles: res.data.articles,
            has_more: res.data.meta.has_more,
            nextPageEndpoint: res.data.meta.has_more ? `${endpoint}?page[size]=${pageSize}&page[after]=${encodeURIComponent(res.data['meta'].after_cursor)}` : '',
            totalResultCount: contentPage ? contentPage.totalResultCount + res.data.articles.length : res.data.articles.length
        };
        yield nango.log(`Saving page with ${content.articles.length} records (total records: ${content.totalResultCount})`);
        return content;
    });
}
function mapZendeskArticles(articles) {
    return articles.map((article) => {
        return {
            title: article.title,
            locale: article.locale,
            user_segment_id: article.user_segment_id,
            permission_group_id: article.permission_group_id,
            author_id: article.author_id,
            body: article.body,
            comments_disabled: article.comments_disabled,
            content_tag_ids: article.content_tag_ids,
            created_at: article.created_at,
            draft: article.draft,
            edited_at: article.edited_at,
            html_url: article.html_url,
            id: article.id,
            label_names: article.label_names,
            outdated: article.outdated,
            outdated_locales: article.outdated_locales,
            position: article.position,
            promoted: article.promoted,
            section_id: article.section_id,
            source_locale: article.source_locale,
            updated_at: article.updated_at,
            url: article.url,
            vote_count: article.vote_count,
            vote_sum: article.vote_sum
        };
    });
}
//# sourceMappingURL=articles.js.map