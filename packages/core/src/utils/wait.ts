export async function wait(time: number): Promise<void> {
  return new Promise((res) => setTimeout(res, time))
}
