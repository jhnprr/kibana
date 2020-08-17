/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { Subject } from 'rxjs';
import { KibanaRequest, Auditor, AuditEvent, AuditEventDecorator } from 'src/core/server';

import { SecurityPluginSetup } from '../../../security/server';
import { SpacesPluginSetup } from '../../../spaces/server';

interface Deps {
  getCurrentUser: SecurityPluginSetup['authc']['getCurrentUser'];
  getSpaceId?: SpacesPluginSetup['spacesService']['getSpaceId'];
}

export class AuditTrailClient implements Auditor {
  constructor(
    private readonly request: KibanaRequest,
    private readonly event$: Subject<AuditEvent>,
    private readonly deps: Deps
  ) {}

  public add<Args>(decorateEvent: AuditEventDecorator<Args>, args: Args) {
    const user = this.deps.getCurrentUser(this.request);
    const spaceId = this.deps.getSpaceId?.(this.request);

    const event = decorateEvent(
      {
        user: {
          name: user?.username!,
          roles: user?.roles,
        },
        kibana: {
          namespace: spaceId!,
        },
        trace: {
          id: 'abc', // TODO: Use `request.id` once https://github.com/elastic/kibana/pull/71019 is merged
        },
      },
      args
    );

    this.event$.next(event);
  }
}
