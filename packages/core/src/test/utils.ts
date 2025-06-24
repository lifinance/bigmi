export const createMockResponse = <T>(
  data: T,
  options?: Partial<Response>
): Response =>
  ({
    ok: true,
    json: () => Promise.resolve(data),
    headers: new Headers({
      'Content-type': 'application/json',
    }),
    ...options,
  }) as Response
