import { TestBed } from '@angular/core/testing';
import { StarsQueryGqlService } from './stars-query-gql.service';

describe('StarsQueryGqlService', () => {
  let service: StarsQueryGqlService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StarsQueryGqlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
