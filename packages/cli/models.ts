export interface GithubIssue {
  id: number;
  owner: string;
  repo: string;
  issue_number: number;
  title: string;
  author: string;
  author_id: string;
  state: string;
  date_created: Date;
  date_last_modified: Date;
  body: string;
}
