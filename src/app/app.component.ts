import { Component } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  cursor: string;
  data = [];
  hasGqlError = false;
  hasNetworkError = false;
  hasNext = false;
  isLoading = true;

  get token(): string {
    return localStorage.getItem('token') || '';
  }

  set token(value: string) {
    localStorage.setItem('token', value);
  }

  starsGql = gql`
    query Stars($after: String) {
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

  starsQuery = this._apollo.watchQuery<any>({
    query: this.starsGql,
    notifyOnNetworkStatusChange: true,
  });

  private _unsubscriber = new Subject();

  constructor(private _apollo: Apollo) {}

  ngOnInit(): void {
    this.starsQuery.valueChanges
      .pipe(
        takeUntil(this._unsubscriber),
        tap((result) => {
          this.isLoading = result.loading;
          this.hasGqlError = result.errors && result.errors.length > 0;
          this.hasNetworkError = false;
        }),
        map((result) => result.data.viewer.starredRepositories)
      )
      .subscribe(
        ({ edges, pageInfo }) => {
          this.data = edges;
          this.hasNext = pageInfo.hasNextPage;
          this.cursor = this.hasNext ? pageInfo.endCursor : undefined;
        },
        () => {
          this.hasNetworkError = true;
        }
      );
  }

  ngOnDestroy(): void {
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  loadNext(): void {
    this.starsQuery.fetchMore({
      variables: { after: this.cursor },
      updateQuery: (before, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return before;
        }

        const updatedStars = [
          ...before.viewer.starredRepositories.edges,
          ...fetchMoreResult.viewer.starredRepositories.edges,
        ];

        const after = Object.assign({}, before, fetchMoreResult);
        after.viewer.starredRepositories.edges = updatedStars;

        return after;
      },
    });
  }
}
