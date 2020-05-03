import { HttpHeaders } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { ApolloModule, APOLLO_OPTIONS } from 'apollo-angular';
import { HttpLink, HttpLinkModule } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink, concat } from 'apollo-link';

const uri = 'https://api.github.com/graphql'; // <-- add the URL of the GraphQL server here

export function createApollo(httpLink: HttpLink) {
  const endpointLink = httpLink.create({ uri });

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
