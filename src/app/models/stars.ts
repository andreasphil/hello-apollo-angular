import { PageInfo, Repository } from 'src/app/models';

export interface Stars {
  totalCount: number;
  pageInfo: PageInfo;
  edges: Array<{ node: Repository }>;
}
