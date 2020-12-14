import fetchMock from 'jest-fetch-mock';

import { IncognitusService, IncognitusConfig } from '../index';

describe('Incognitus Service', () => {
  let config: IncognitusConfig;

  beforeEach(() => {
    fetchMock.resetMocks();
    IncognitusService.reset();
    fetchMock.mockResponse(async () => ({
      body: JSON.stringify({ Features: [] }),
    }));
    config = {
      aipUrl: 'https://localhost',
      tenantId: 'abc',
      applicationId: 'xyz.123',
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('instance', () => {
    it('should throw error when getting instance before initializing', async () => {
      expect(() => IncognitusService.instance).toThrowError();
    });

    it('should return instance after initializing', async () => {
      await IncognitusService.initialize({
        tenantId: 'abc',
        applicationId: 'xyz.123',
      } as IncognitusConfig);
      expect(IncognitusService.instance).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should create a new instance every time it`s called', async () => {
      await IncognitusService.initialize(config);
      const instance1 = IncognitusService.instance;
      await IncognitusService.initialize(config);
      const instance2 = IncognitusService.instance;

      expect(instance1).not.toBe(instance2);
    });

    it('should fetch the initial set of features', async () => {
      fetchMock.mockResponse(async (req) => {
        if (req.url.endsWith('/feature')) {
          return {
            body: JSON.stringify({
              Features: [
                { name: 'feat1', isEnabled: true },
                { name: 'feat2', isEnabled: true },
              ],
            }),
            status: 200,
          };
        }

        return {
          status: 500,
        };
      });

      await IncognitusService.initialize(config);

      const instance = IncognitusService.instance;
      await expect(instance.isEnabled('feat1')).resolves.toBe(true);
      await expect(instance.isEnabled('feat2')).resolves.toBe(true);
    });
  });

  describe('isReady', () => {
    it('should be false before initializing', () => {
      expect(IncognitusService.isReady).toBe(false);
    });

    it('should be true after intializing', async () => {
      await IncognitusService.initialize(config);

      expect(IncognitusService.isReady).toBe(true);
    });
  });

  describe('ctor', () => {
    it('should throw an error when the tenant is blank', () => {
      expect(
        () =>
          new IncognitusService({
            applicationId: 'abc',
          } as IncognitusConfig),
      ).toThrowError();
    });

    it('should throw an error when the application is blank', () => {
      expect(
        () =>
          new IncognitusService({
            tenantId: 'abc',
          } as IncognitusConfig),
      ).toThrowError();
    });
  });

  describe('isEnabled', () => {
    it('should return the status when feature is cached', async () => {
      const svc = new IncognitusService(config);
      svc.setCache(
        new Map([
          ['foo', true],
          ['bar', false],
        ]),
      );

      await expect(svc.isEnabled('foo')).resolves.toBe(true);
      await expect(svc.isEnabled('bar')).resolves.toBe(false);
    });

    it('should fetch missing flags', async () => {
      fetchMock
        .mockOnce(JSON.stringify({ name: 'foo', isEnabled: true }))
        .mockReject();

      const svc = new IncognitusService(config);
      await svc.isEnabled('foo');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('isDisabled', () => {
    it('should return the status when feature is cached', async () => {
      const svc = new IncognitusService(config);
      svc.setCache(
        new Map([
          ['foo', false],
          ['bar', true],
        ]),
      );

      await expect(svc.isDisabled('foo')).resolves.toBe(true);
      await expect(svc.isDisabled('bar')).resolves.toBe(false);
    });

    it('should fetch missing flags', async () => {
      fetchMock
        .mockOnce(JSON.stringify({ name: 'foo', isEnabled: true }))
        .mockReject();

      const svc = new IncognitusService(config);
      await svc.isDisabled('foo');

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllFeatures', () => {
    let svc: IncognitusService;

    beforeEach(() => {
      svc = new IncognitusService(config);
    });

    it('should fetch all features', async () => {
      await svc.getAllFeatures();

      expect(fetchMock).toBeCalledWith(`${config.aipUrl}/feature`, {
        headers: {
          'X-Application': config.applicationId,
          'X-Tenant': config.tenantId,
        },
      });
    });

    it('should log an error when api fails', async () => {
      fetchMock.mockResponse(async () => ({ status: 500 }));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {
        /* nop */
      });

      await svc.getAllFeatures();

      expect(spy).toHaveBeenCalled();
    });

    it('should log an error when fetch fails', async () => {
      fetchMock.mockReject();
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {
        /* nop */
      });

      await svc.getAllFeatures();

      expect(spy).toHaveBeenCalled();
    });

    it('should set the cache', async () => {
      fetchMock
        .mockOnce(
          JSON.stringify({ Features: [{ name: 'foo', isEnabled: true }] }),
        )
        .mockReject();

      await svc.getAllFeatures();
      const res = await svc.isEnabled('foo');
      expect(res).toBe(true);
    });
  });

  describe('getFeature', () => {
    let svc: IncognitusService;

    beforeEach(() => {
      svc = new IncognitusService(config);
    });

    it('should log an error when api fails', async () => {
      fetchMock.mockResponse(async () => ({ status: 500 }));
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {
        /* nop */
      });

      const res = await svc.getFeature('');

      expect(spy).toHaveBeenCalled();
      expect(res).toBe(false);
    });

    it('should log an error when fetch fails', async () => {
      fetchMock.mockReject();
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {
        /* nop */
      });

      const res = await svc.getFeature('');

      expect(spy).toHaveBeenCalled();
      expect(res).toBe(false);
    });

    it('should return the status of the feature', async () => {
      fetchMock.mockOnce(JSON.stringify({ name: 'foo', isEnabled: true }));

      const res = await svc.getFeature('foo');
      expect(res).toBe(true);
    });

    it('should set the cache', async () => {
      fetchMock
        .mockOnce(JSON.stringify({ name: 'foo', isEnabled: true }))
        .mockReject();

      await svc.getFeature('foo');
      const res = await svc.isEnabled('foo');
      expect(res).toBe(true);
    });
  });
});
