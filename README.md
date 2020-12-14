# Incognitus Feature Flag (web core)

![Continuous Integration](https://github.com/Incognitus-Io/client-web-core/workflows/Continuous%20Integration/badge.svg)
[![codecov](https://codecov.io/gh/Incognitus-Io/client-web-core/branch/master/graph/badge.svg?token=BNC9RERF0K)](https://codecov.io/gh/Incognitus-Io/client-web-core)
[![npm version](https://badge.fury.io/js/%40incognitus%2Fclient-web-core.svg)](https://badge.fury.io/js/%40incognitus%2Fclient-web-core)

## Integrating Incognitus

## Initializing the service

Before you're able to use the service you'll need to initialize with your tenant and application IDs.

#### index.ts

Initialize Incognitus service

```typescript
import { IncognitusService, IncognitusConfig } from '@incognitus/client-web-core';

const incognitusConfig = {
  tenantId: '{your tenant key}',
  applicationId: '{your app id}',
} as IncognitusConfig;

const IncognitusService.initialize(incognitusConfig);
```

| Key           | Description               |
| ------------- | ------------------------- |
| tenantId      | Your tenant id            |
| applicationId | The id of the application |

## Checking features

```typescript
import { IncognitusService } from '@incognitus/client-web-core';

const svc = IncognitusService.instance;

const foobar = async () => {
  if (await svc.isEnabled('{feature name}')) {
    return 'new feature text';
  }
  return 'old feature text';
};
```

## Methods

| Method                               | Description                                                 |
| ------------------------------------ | ----------------------------------------------------------- |
| IncognitusService.initialize(config) | Initializes the service (must be called first)              |
| IncognitusService.instance           | The shared instance of the service                          |
| svc.isEnabled(featureName)           | Checks if the flag is enabled                               |
| svc.isDisabled(featureName)          | Check if the flag is disabled                               |
| svc.getFeature(featureName)          | Fetches the feature from the server and returns it's status |
| svc.getAllFeatures()                 | Fetches all features and stores them in the cache           |

## Caching

Currently all known feature flags are cached when the app initializes. New features that are not found
in the cache are retrieved on-demand. The cache stays in place until the app is reloaded or by calling the `getAllFeatures()` method on the service.

### Future Caching Stories

- Save verified cache to local storage
- Provide hard cache refresh (wipe cache if fails)
- Provide soft cache refresh (keep cache if fails)
- Customizable cache refresh times
- Option to disable cache
