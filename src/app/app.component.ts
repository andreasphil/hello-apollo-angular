import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { StarsQueryGqlService } from 'src/app/services/stars-query-gql.service';
import { Repository } from 'src/app/models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  /**
   * The GraphQL query for loading data from the API. Unlike a normal query
   * (which would be created using `fetch()`), a watch query is updated
   * whenever Apollo's cache changes. For example, if we used the same query
   * in a different component and received newer data, data in this component
   * would be updated as well.
   */
  starsQuery = this._starsQueryGql.watch(
    {}, // no variables
    {
      // Setting this option emits the `valueChanges` event not just when a
      // request finishes, but also while it is running. This allows us to
      // get notifiied about active requests in real time, which we'll use
      // to display some indication that something is happening while the
      // request is running.
      notifyOnNetworkStatusChange: true
    }
  );

  /**
   * Reads the current token from localStorage. The token is also read by
   * Apollo before each request and used for authorizing requests with the
   * API.
   */
  get token(): string {
    return localStorage.getItem('token') || '';
  }

  /**
   * Updates the token in localStorage.
   */
  set token(value: string) {
    localStorage.setItem('token', value);
  }

  /**
   * Contains the list of starred repositories fetched from the API.
   */
  data: Array<{ node: Repository }> = [];

  /**
   * True if there are any errors related to GraphQL. This may happen, for
   * example, if a malformed query is sent to the API.
   */
  hasGqlError = false;

  /**
   * True if there are any errors related to processing the request other than
   * GraphQL, i.e. the request ends with a status code other than OK. This may
   * happen, for example, if you try sending an unauthorized request or you're
   * offline.
   */
  hasNetworkError = false;

  /**
   * Inidcates that there is more data in the list that can be fetched from the
   * API.
   */
  hasNext = false;

  /**
   * The cursor points to the last item that you've loaded from the API. If there
   * is more to load, the next request should ask for items in the list that come
   * after the position specified by the cursor.
   */
  private _cursor: string;

  /**
   * True while an API request is running.
   */
  isLoading = true;

  /**
   * Shorthand for determining whether there is any error regardless of the
   * type.
   */
  get hasError(): boolean {
    return this.hasGqlError || this.hasNetworkError;
  }

  /**
   * Shorthand for determining whether there is any data.
   */
  get hasData(): boolean {
    return !!this.data?.length;
  }

  /**
   * Helper for cleaning up subscriptions.
   */
  private _unsubscriber = new Subject();

  constructor(private _starsQueryGql: StarsQueryGqlService) {}

  ngOnInit(): void {
    // This observable emits whenever the query receives new data
    this.starsQuery.valueChanges
      .pipe(
        // Stop when the component is destroyed
        takeUntil(this._unsubscriber),

        // `tap()` can be used for executing side effects. For this example,
        // I'm treating updating the UI with feedback for the user as side
        // effects so we have a separation between setting some status flags
        // and actually processing the data we've received. This is not really
        // necessary, but I find it to be a bit easier to understand.
        tap(({ loading, errors }) => {
          this.isLoading = loading;
          this.hasGqlError = errors && errors.length > 0;
          this.hasNetworkError = false;
        }),

        // We'll only need the starredRepositories for what comes next, so
        // let's make that a bit easier to access
        map((result) => result.data.viewer.starredRepositories)
      )
      .subscribe(
        // Update our local copy of the data and pagination info when something
        // new arrives
        ({ edges, pageInfo }) => {
          this.data = edges;
          this.hasNext = pageInfo.hasNextPage;
          this._cursor = this.hasNext ? pageInfo.endCursor : undefined;
        },

        // Set status flags when the subscription throws an error
        () => {
          this.hasNetworkError = true;
          this.isLoading = false;
        }
      );
  }

  ngOnDestroy(): void {
    // Clean up subscriptions before destroying the component. This is to
    // prevent memory leaks.
    this._unsubscriber.next();
    this._unsubscriber.complete();
  }

  /**
   * Loads the next batch of items from the API.
   */
  loadNext(): void {
    this.starsQuery.fetchMore({
      // Tell the API that we want all items after the last one we've received
      variables: { after: this._cursor },

      // This callback is used by Apollo to merge the data we've just received
      // with what we already have.
      updateQuery: (before, { fetchMoreResult }) => {
        if (!fetchMoreResult) {
          return before;
        }

        // Merge the old and the new list
        const updatedStars = [
          ...before.viewer.starredRepositories.edges,
          ...fetchMoreResult.viewer.starredRepositories.edges,
        ];

        // Update the old object with the new data
        const after = Object.assign({}, before, fetchMoreResult);
        after.viewer.starredRepositories.edges = updatedStars;

        // Return the updated data. This will trigger the query's
        // `valueChanges` event.
        return after;
      },
    });
  }
}
