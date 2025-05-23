export const createMockResponse = <T>(data: T): Response =>
  ({
    ok: true,
    json: () => Promise.resolve(data),
    headers: new Headers({
      'Content-type': 'application/json',
    }),
  }) as Response
