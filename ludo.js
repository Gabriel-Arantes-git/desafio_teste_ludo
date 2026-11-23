const BASE = -1;
const ULTIMA_CASA_DA_TRILHA = 50;
const CHEGADA = 56;
const CASAS_NA_TRILHA = 52;
const PECAS_POR_JOGADOR = 4;
const CASAS_SEGURAS = [0, 8, 13, 21, 26, 34, 39, 47];
const CORES = [
  { cor: 'vermelho', saida: 0 },
  { cor: 'amarelo', saida: 26 },
];

function criarAleatorio(semente) {
  let estado = semente >>> 0;
  return function proximo() {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dadoComSemente(semente) {
  const aleatorio = criarAleatorio(semente);
  return () => 1 + Math.floor(aleatorio() * 6);
}

function dadoDeSequencia(valores) {
  const fila = [...valores];
  return () => {
    if (fila.length === 0) throw new Error('Sequência de dados esgotada');
    return fila.shift();
  };
}

class Ludo {
  constructor({ nomes = ['Jogador 1', 'Jogador 2'], dado = () => 1 + Math.floor(Math.random() * 6) } = {}) {
    if (!Array.isArray(nomes) || nomes.length !== 2) throw new Error('A partida é para 2 jogadores');
    this._dado = dado;
    this.jogadores = nomes.map((nome, i) => ({
      nome,
      cor: CORES[i].cor,
      saida: CORES[i].saida,
      pecas: Array(PECAS_POR_JOGADOR).fill(BASE),
    }));
    this.vez = 0;
    this.dado = null;
    this.seisSeguidos = 0;
    this.estado = 'jogando';
    this.vencedor = null;
    this.historico = [];
  }

  get jogadorDaVez() {
    return this.jogadores[this.vez];
  }

  casaNaTrilha(indiceJogador, progresso) {
    if (progresso < 0 || progresso > ULTIMA_CASA_DA_TRILHA) return null;
    return (this.jogadores[indiceJogador].saida + progresso) % CASAS_NA_TRILHA;
  }

  definirPosicoes(indiceJogador, pecas) {
    if (pecas.length !== PECAS_POR_JOGADOR) throw new Error('Cada jogador tem 4 peças');
    if (pecas.some((p) => !Number.isInteger(p) || p < BASE || p > CHEGADA)) throw new Error('Posição inválida');
    this.jogadores[indiceJogador].pecas = [...pecas];
  }

  movimentosPossiveis(valor = this.dado) {
    if (valor === null) return [];
    const indices = [];
    this.jogadorDaVez.pecas.forEach((progresso, i) => {
      if (progresso === BASE ? valor === 6 : progresso !== CHEGADA && progresso + valor <= CHEGADA) indices.push(i);
    });
    return indices;
  }

  lancarDado(valor) {
    this._exigirEmAndamento();
    if (this.dado !== null) throw new Error('Mova uma peça antes de lançar o dado de novo');
    if (valor === undefined) valor = this._dado();
    if (!Number.isInteger(valor) || valor < 1 || valor > 6) throw new Error('O dado vai de 1 a 6');

    const jogador = this.jogadorDaVez.nome;
    this.seisSeguidos = valor === 6 ? this.seisSeguidos + 1 : 0;
    if (this.seisSeguidos === 3) {
      this.historico.push({ jogador, valor, perdeuAVez: true });
      this._passarVez();
      return { valor, movimentos: [], perdeuAVez: true };
    }

    const movimentos = this.movimentosPossiveis(valor);
    if (movimentos.length === 0) {
      this.historico.push({ jogador, valor, semMovimento: true });
      if (valor === 6) return { valor, movimentos, jogaDeNovo: true };
      this._passarVez();
      return { valor, movimentos, passouAVez: true };
    }
    this.dado = valor;
    return { valor, movimentos };
  }

  mover(indicePeca) {
    this._exigirEmAndamento();
    if (this.dado === null) throw new Error('Lance o dado antes de mover');
    if (!Number.isInteger(indicePeca) || indicePeca < 0 || indicePeca >= PECAS_POR_JOGADOR) {
      throw new Error('Peça inválida: use 0 a 3');
    }
    const valor = this.dado;
    if (!this.movimentosPossiveis(valor).includes(indicePeca)) {
      throw new Error(`A peça ${indicePeca} não pode andar ${valor} casa(s)`);
    }

    const jogador = this.jogadorDaVez;
    const de = jogador.pecas[indicePeca];
    const para = de === BASE ? 0 : de + valor;
    jogador.pecas[indicePeca] = para;

    const casa = this.casaNaTrilha(this.vez, para);
    const capturou = this._capturar(casa);
    const chegou = para === CHEGADA;
    const jogaDeNovo = valor === 6 || capturou > 0 || chegou;
    const resultado = { peca: indicePeca, de, para, casa, capturou, chegou, jogaDeNovo };
    this.historico.push({ jogador: jogador.nome, valor, ...resultado });
    this.dado = null;

    if (jogador.pecas.every((p) => p === CHEGADA)) {
      this.estado = 'fim';
      this.vencedor = jogador.nome;
      return { ...resultado, vitoria: true };
    }
    if (!jogaDeNovo) this._passarVez();
    return resultado;
  }

  _capturar(casa) {
    if (casa === null || CASAS_SEGURAS.includes(casa)) return 0;
    const adversario = 1 - this.vez;
    const alvos = [];
    this.jogadores[adversario].pecas.forEach((p, i) => {
      if (this.casaNaTrilha(adversario, p) === casa) alvos.push(i);
    });
    if (alvos.length !== 1) return 0;
    this.jogadores[adversario].pecas[alvos[0]] = BASE;
    return 1;
  }

  _passarVez() {
    this.vez = 1 - this.vez;
    this.seisSeguidos = 0;
    this.dado = null;
  }

  _exigirEmAndamento() {
    if (this.estado !== 'jogando') throw new Error('A partida já terminou');
  }
}

module.exports = {
  Ludo,
  criarAleatorio,
  dadoComSemente,
  dadoDeSequencia,
  BASE,
  CHEGADA,
  CASAS_NA_TRILHA,
  CASAS_SEGURAS,
  ULTIMA_CASA_DA_TRILHA,
};
