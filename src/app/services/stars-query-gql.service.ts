import { Injectable } from '@angular/core';
import { Query } from 'apollo-angular';
import gql from 'graphql-tag';
import { Viewer } from 'src/app/models';

export interface StarsResponse {
  viewer: Viewer;
}

/**
 * Returns a list of starred repositories for the current user. The list is
 * limited to 50 items (default would be 100). To fetch the next batch from
 * the API, you can use the information provided by `pageInfo`: `hasNextPage`
 * tells you if there's more data to load, `endCursor` is the position of the
 * last item you've loaded. Set the `$after` variable to the value of the
 * `endCursor` to get the next batch.
 */
@Injectable({
  providedIn: 'root',
})
export class StarsQueryGqlService extends Query<StarsResponse> {
  document = gql`
    query stars($after: String) {
      viewer {
        starredRepositories(after: $after, first: 50) {
          totalCount
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            node {
              id
              nameWithOwner
              description
              url
            }
          }
        }
      }
    }
  `;
}
