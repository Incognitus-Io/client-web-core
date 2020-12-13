import foo from '../index';

describe('Entrypoint', () => {
  it('should return foo', () => {
    expect(foo).toBeDefined();
  });
});
