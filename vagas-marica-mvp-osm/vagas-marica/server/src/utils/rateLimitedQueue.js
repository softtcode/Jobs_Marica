const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fila global que executa as tarefas UMA POR VEZ, com intervalo mínimo entre
 * o início de uma tarefa e a seguinte. Usada para respeitar o limite de
 * 1 requisição por segundo da instância pública do Nominatim.
 */
export class RateLimitedQueue {
  constructor(minIntervalMs) {
    this.minIntervalMs = minIntervalMs;
    this.tail = Promise.resolve();
    this.lastStart = 0;
  }

  schedule(task) {
    const run = async () => {
      const wait = this.lastStart + this.minIntervalMs - Date.now();
      if (wait > 0) await sleep(wait);
      this.lastStart = Date.now();
      return task();
    };
    const result = this.tail.then(run, run);
    this.tail = result.catch(() => {}); // um erro não trava a fila
    return result;
  }
}
