/**
 * The configuration options to initialize the Incognitus service.
 */
export interface IncognitusConfig {
  /** The api to use to check features. */
  aipUrl?: string;
  /** Your tenant ID, found in the managment console. */
  tenantId: string;
  /** The application ID, found in the management console. */
  applicationId: string;
}

interface AllFeatureResponse {
  Features: Feature[];
}

interface Feature {
  name: string;
  isEnabled: boolean;
}

interface ApiHeaders {
  'X-Tenant': string;
  'X-Application': string;
  [key: string]: string;
}

/**
 * A service for communicating with the Incognitus API.
 */
export class IncognitusService {
  /* test-code */
  public setCache(cache: Map<string, boolean>) {
    this.featureCache = Object.freeze(cache);
  }
  public static reset() {
    IncognitusService._instance = undefined;
  }
  /* end-test-code */

  /**
   * @returns the instance of the Incognitus service.
   */
  public static get instance() {
    if (!IncognitusService._instance) {
      console.error('Service not initialized');
    }
    return IncognitusService._instance;
  }

  /**
   * @returns if the service is ready for use.
   */
  public static get isReady() {
    return IncognitusService._instance !== undefined;
  }
  private static _instance?: IncognitusService;

  /**
   * Initalizes the Incognitus service and fetches all features.
   *
   * @param config the configuration options.
   */
  public static initialize = async (config: IncognitusConfig) => {
    const service = new IncognitusService(config);
    await service.getAllFeatures();
    IncognitusService._instance = service;
  };

  private featureCache = Object.freeze(new Map<string, boolean>());
  private fetchHeaders: ApiHeaders;

  /**
   * @internal Please use `IncognitusService.instance` instead.
   */
  constructor(private config: IncognitusConfig) {
    if (!config.tenantId) throw new Error('`tenantId` is required');
    if (!config.applicationId) throw new Error('`applicationId` is required');
    this.fetchHeaders = {
      'X-Tenant': config.tenantId,
      'X-Application': config.applicationId,
    } as ApiHeaders;
  }

  private get baseUri() {
    const base = this.config.aipUrl || 'https://incognitus.io/api';
    return `${base}/feature`;
  }

  /**
   * Checks if a feature flag is enabled.  If not previously fetched, this
   * will also fetch the flag.
   * @param name The name of the feature flag.
   */
  public async isEnabled(name: string) {
    let status = this.featureCache.get(name);
    if (status === undefined) {
      status = await this.getFeature(name);
    }
    return status;
  }

  /**
   * Checks if a feature flag is disabled.  If not previously fetched, this
   * will also fetch the flag.
   * @param name The name of the feature flag.
   */
  public async isDisabled(name: string) {
    return !(await this.isEnabled(name));
  }

  /**
   * Fetches all feature flags for the configured service.
   */
  public async getAllFeatures() {
    try {
      const res = await fetch(this.baseUri, {
        headers: this.fetchHeaders,
      });

      if (!res.ok) {
        console.error('Failed to get all features');
        return;
      }
      const apiRes = (await res.json()) as AllFeatureResponse;
      const features = apiRes.Features.reduce(
        (acc, val) => acc.set(val.name, val.isEnabled),
        new Map<string, boolean>(),
      );
      this.featureCache = Object.freeze(features);
    } catch (e) {
      console.error('Failed to get all features', e);
    }
  }

  /**
   * Fetches a specified feature flag
   *
   * @param name The name of the feature flag to fetch.
   * @returns The status of the feature flag, else `False` if
   * the request failed.
   */
  public async getFeature(name: string) {
    try {
      const res = await fetch(`${this.baseUri}/${name}`, {
        headers: this.fetchHeaders,
      });

      if (!res.ok) {
        console.error('Failed to get feature');
        return false;
      }
      const apiRes = (await res.json()) as Feature;

      const features = new Map<string, boolean>(
        this.featureCache as Map<string, boolean>,
      );
      features.set(apiRes.name, apiRes.isEnabled);
      this.featureCache = Object.freeze(features);

      return apiRes.isEnabled;
    } catch (e) {
      console.error('Failed to get feature', e);
      return false;
    }
  }
}
