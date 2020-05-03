import { HttpHeaders } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink, HttpLinkModule } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, concat } from 'apollo-link';

const uri = 'https://api.github.com/graphql'; // <-- add the URL of the GraphQL server here

/**
 * This factory function gives us a new Apollo instance. The HttpLink is what
 * Apollo is using for performing the network request. In this example, it
 * contains the URL of the endpoint as well as a header with the token needed
 * for authenticating the request.
 */
export function createApollo(httpLink: HttpLink) {
  // Reference to the endpoint
  const endpointLink = httpLink.create({ uri });

  // A middleware link (https://www.apollographql.com/docs/link/). This is used
  // for setting a header on every request created by Apollo.
  const token = localStorage.getItem('token');
  const authLink = new ApolloLink((operation, forward) => {
    operation.setContext({
      headers: new HttpHeaders().set('Authorization', `bearer ${token}`),
    });

    return forward(operation);
  });

  return {
    link: concat(authLink, endpointLink),
    cache: new InMemoryCache(),
  };
}

@NgModule({
  exports: [ApolloModule, HttpLinkModule],
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
      deps: [HttpLink],
    },
  ],
})
export class GraphQLModule {}
