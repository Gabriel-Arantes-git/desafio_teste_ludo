const {
  Ludo,
  dadoComSemente,
  dadoDeSequencia,
  BASE,
  CHEGADA,
  CASAS_NA_TRILHA,
  CASAS_SEGURAS,
  ULTIMA_CASA_DA_TRILHA,
} = require('./ludo');

const novaPartida = () => new Ludo({ nomes: ['Ana', 'Bruno'] });

const progressoPara = (jogo, indiceJogador, casa) =>
  (casa - jogo.jogadores[indiceJogador].saida + CASAS_NA_TRILHA) % CASAS_NA_TRILHA;

describe('Início da partida', () => {
  test('as constantes do tabuleiro: 52 casas na trilha, casa 50 é a última da trilha, 56 é o centro', () => {
    expect(CASAS_NA_TRILHA).toBe(52);
    expect(ULTIMA_CASA_DA_TRILHA).toBe(50);
    expect(CHEGADA).toBe(56);
    expect(BASE).toBe(-1);
  });

  test('as casas seguras são as saídas e as estrelas: 0, 8, 13, 21, 26, 34, 39 e 47', () => {
    expect(CASAS_SEGURAS).toEqual([0, 8, 13, 21, 26, 34, 39, 47]);
  });

  test('são 2 jogadores: vermelho sai da casa 0 e amarelo da casa 26, em lados opostos', () => {
    const jogo = novaPartida();
    expect(jogo.jogadores.map((j) => j.cor)).toEqual(['vermelho', 'amarelo']);
    expect(jogo.jogadores.map((j) => j.saida)).toEqual([0, 26]);
    expect(jogo.jogadores[1].saida - jogo.jogadores[0].saida).toBe(CASAS_NA_TRILHA / 2);
  });

  test('cada jogador tem 4 peças, todas na base', () => {
    const jogo = novaPartida();
    jogo.jogadores.forEach((j) => expect(j.pecas).toEqual([BASE, BASE, BASE, BASE]));
  });

  test('o primeiro jogador (vermelho) começa, e a partida está em andamento', () => {
    const jogo = novaPartida();
    expect(jogo.jogadorDaVez.nome).toBe('Ana');
    expect(jogo.vez).toBe(0);
    expect(jogo.estado).toBe('jogando');
    expect(jogo.vencedor).toBeNull();
    expect(jogo.dado).toBeNull();
    expect(jogo.historico).toEqual([]);
  });

  test.each([[['A']], [['A', 'B', 'C']], [[]]])('partida com os nomes %p é recusada: só 2 jogadores', (nomes) => {
    expect(() => new Ludo({ nomes })).toThrow('2 jogadores');
  });

  test('sem nomes informados, os jogadores recebem nomes padrão', () => {
    expect(new Ludo().jogadores.map((j) => j.nome)).toEqual(['Jogador 1', 'Jogador 2']);
  });
});

describe('Posição das peças na trilha', () => {
  test('o vermelho começa na casa 0 e o amarelo na casa 26', () => {
    const jogo = novaPartida();
    expect(jogo.casaNaTrilha(0, 0)).toBe(0);
    expect(jogo.casaNaTrilha(1, 0)).toBe(26);
  });

  test('a trilha é circular: o amarelo com 26 passos chega à casa 0 e com 50 passos à casa 24', () => {
    const jogo = novaPartida();
    expect(jogo.casaNaTrilha(1, 26)).toBe(0);
    expect(jogo.casaNaTrilha(1, 50)).toBe(24);
  });

  test('a última casa da trilha do vermelho é a 50', () => {
    expect(novaPartida().casaNaTrilha(0, 50)).toBe(50);
  });

  test.each([BASE, 51, 55, CHEGADA])('peça com progresso %i não está na trilha', (progresso) => {
    expect(novaPartida().casaNaTrilha(0, progresso)).toBeNull();
  });

  test('definirPosicoes guarda uma cópia das posições', () => {
    const jogo = novaPartida();
    const posicoes = [10, 20, BASE, BASE];
    jogo.definirPosicoes(0, posicoes);
    posicoes[0] = 99;
    expect(jogo.jogadores[0].pecas).toEqual([10, 20, BASE, BASE]);
  });

  test('definirPosicoes recusa quantidade errada de peças e posições impossíveis', () => {
    const jogo = novaPartida();
    expect(() => jogo.definirPosicoes(0, [1, 2, 3])).toThrow('4 peças');
    expect(() => jogo.definirPosicoes(0, [57, 0, 0, 0])).toThrow('Posição inválida');
    expect(() => jogo.definirPosicoes(0, [-2, 0, 0, 0])).toThrow('Posição inválida');
    expect(() => jogo.definirPosicoes(0, [1.5, 0, 0, 0])).toThrow('Posição inválida');
  });
});

describe('Dado', () => {
  test.each([0, 7, -1, 2.5, '3', NaN, null])('valor %p é recusado: o dado vai de 1 a 6', (valor) => {
    expect(() => novaPartida().lancarDado(valor)).toThrow('1 a 6');
  });

  test('o dado injetado é usado quando nenhum valor é informado', () => {
    const jogo = new Ludo({ nomes: ['Ana', 'Bruno'], dado: dadoDeSequencia([6]) });
    expect(jogo.lancarDado().valor).toBe(6);
  });

  test('um valor informado tem prioridade sobre o dado injetado', () => {
    const jogo = new Ludo({
      nomes: ['Ana', 'Bruno'],
      dado: () => {
        throw new Error('não deveria sortear');
      },
    });
    expect(jogo.lancarDado(4).valor).toBe(4);
  });

  test('o dado sorteado vai sempre de 1 a 6 e todas as faces aparecem', () => {
    const dado = dadoComSemente(10);
    const faces = new Set();
    for (let i = 0; i < 600; i++) {
      const { valor } = new Ludo({ nomes: ['Ana', 'Bruno'], dado }).lancarDado();
      expect(valor).toBeGreaterThanOrEqual(1);
      expect(valor).toBeLessThanOrEqual(6);
      faces.add(valor);
    }
    expect(faces.size).toBe(6);
  });

  test('não se lança o dado de novo antes de mover a peça', () => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    expect(() => jogo.lancarDado(3)).toThrow('Mova uma peça antes');
  });

  test('não se move peça sem lançar o dado', () => {
    expect(() => novaPartida().mover(0)).toThrow('Lance o dado antes de mover');
  });

  test('sem dado lançado não há movimentos possíveis', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, 20, BASE, BASE]);
    expect(jogo.movimentosPossiveis()).toEqual([]);
  });

  test('o valor lançado fica guardado até a peça ser movida', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.lancarDado(3);
    expect(jogo.dado).toBe(3);
    jogo.mover(0);
    expect(jogo.dado).toBeNull();
  });
});

describe('Saída da base', () => {
  test('sem 6 ninguém sai da base e a vez passa a cada lançamento', () => {
    const jogo = novaPartida();
    for (const valor of [1, 2, 3, 4, 5]) {
      const vez = jogo.vez;
      expect(jogo.lancarDado(valor)).toEqual({ valor, movimentos: [], passouAVez: true });
      expect(jogo.vez).toBe(1 - vez);
    }
  });

  test('com 6, qualquer das 4 peças da base pode sair', () => {
    expect(novaPartida().lancarDado(6)).toEqual({ valor: 6, movimentos: [0, 1, 2, 3] });
  });

  test('a peça que sai vai para a casa de saída da sua cor, e as outras ficam na base', () => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    expect(jogo.mover(2)).toMatchObject({ peca: 2, de: BASE, para: 0, casa: 0, capturou: 0 });
    expect(jogo.jogadores[0].pecas).toEqual([BASE, BASE, 0, BASE]);
  });

  test('a peça amarela sai na casa 26', () => {
    const jogo = novaPartida();
    jogo.lancarDado(1);
    jogo.lancarDado(6);
    expect(jogo.mover(0)).toMatchObject({ de: BASE, para: 0, casa: 26 });
    expect(jogo.jogadores[1].pecas).toEqual([0, BASE, BASE, BASE]);
  });

  test('peça na base não anda com valor diferente de 6, mesmo havendo outra peça no jogo', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    expect(jogo.lancarDado(3).movimentos).toEqual([0]);
    expect(() => jogo.mover(1)).toThrow('A peça 1 não pode andar 3 casa(s)');
  });

  test('com 6 e outra peça já na trilha, o jogador escolhe entre sair da base e andar', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    expect(jogo.lancarDado(6).movimentos).toEqual([0, 1, 2, 3]);
  });

  test('sair da base sobre um adversário na casa de saída não o captura (casa segura)', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 0), BASE, BASE, BASE]);
    jogo.lancarDado(6);
    expect(jogo.mover(0)).toMatchObject({ casa: 0, capturou: 0 });
    expect(jogo.jogadores[1].pecas[0]).toBe(26);
  });
});

describe('Movimento', () => {
  test('a peça anda o valor do dado', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.lancarDado(4);
    expect(jogo.mover(0)).toMatchObject({ de: 10, para: 14, casa: 14 });
    expect(jogo.jogadores[0].pecas).toEqual([14, BASE, BASE, BASE]);
  });

  test('só a peça escolhida anda', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, 20, BASE, BASE]);
    expect(jogo.lancarDado(2).movimentos).toEqual([0, 1]);
    jogo.mover(1);
    expect(jogo.jogadores[0].pecas).toEqual([10, 22, BASE, BASE]);
  });

  test('depois de um valor diferente de 6 a vez passa para o outro jogador', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.lancarDado(4);
    jogo.mover(0);
    expect(jogo.jogadorDaVez.nome).toBe('Bruno');
  });

  test('a peça amarela dá a volta no tabuleiro: do progresso 24 (casa 50) com 5 passos chega à casa 3', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(1, [24, BASE, BASE, BASE]);
    jogo.lancarDado(1);
    jogo.lancarDado(5);
    expect(jogo.mover(0)).toMatchObject({ de: 24, para: 29, casa: 3 });
  });

  test.each([4, -1, 1.5, '0', undefined])('índice de peça %p é recusado', (indice) => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    expect(() => jogo.mover(indice)).toThrow('Peça inválida');
  });

  test('peça que não pode andar o valor lançado é recusada e o dado continua valendo', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [56, 54, 10, BASE]);
    expect(jogo.lancarDado(3).movimentos).toEqual([2]);
    expect(() => jogo.mover(1)).toThrow('A peça 1 não pode andar 3 casa(s)');
    expect(jogo.dado).toBe(3);
    expect(jogo.mover(2)).toMatchObject({ para: 13 });
  });

  test('movimentos possíveis excluem peças no centro, peças que passariam do centro e peças na base', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [56, 54, 10, BASE]);
    expect(jogo.movimentosPossiveis(3)).toEqual([2]);
    expect(jogo.movimentosPossiveis(2)).toEqual([1, 2]);
    expect(jogo.movimentosPossiveis(6)).toEqual([2, 3]);
  });

  test('o histórico registra o jogador, o valor e o resultado do movimento', () => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    jogo.mover(0);
    expect(jogo.historico).toEqual([
      { jogador: 'Ana', valor: 6, peca: 0, de: BASE, para: 0, casa: 0, capturou: 0, chegou: false, jogaDeNovo: true },
    ]);
  });

  test('lançamento sem movimento possível também entra no histórico', () => {
    const jogo = novaPartida();
    jogo.lancarDado(3);
    expect(jogo.historico).toEqual([{ jogador: 'Ana', valor: 3, semMovimento: true }]);
  });
});

describe('Jogada extra', () => {
  test('quem tira 6 joga de novo, e depois de um valor diferente de 6 a vez passa', () => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    expect(jogo.mover(0).jogaDeNovo).toBe(true);
    expect(jogo.jogadorDaVez.nome).toBe('Ana');
    jogo.lancarDado(3);
    expect(jogo.mover(0).jogaDeNovo).toBe(false);
    expect(jogo.jogadores[0].pecas[0]).toBe(3);
    expect(jogo.jogadorDaVez.nome).toBe('Bruno');
  });

  test('capturar uma peça adversária dá jogada extra, mesmo sem tirar 6', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 12), BASE, BASE, BASE]);
    jogo.lancarDado(2);
    const r = jogo.mover(0);
    expect(r).toMatchObject({ casa: 12, capturou: 1, jogaDeNovo: true });
    expect(jogo.jogadorDaVez.nome).toBe('Ana');
    expect(jogo.dado).toBeNull();
  });

  test('chegar ao centro dá jogada extra, mesmo sem tirar 6', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [54, 10, BASE, BASE]);
    jogo.lancarDado(2);
    expect(jogo.mover(0)).toMatchObject({ para: CHEGADA, chegou: true, jogaDeNovo: true });
    expect(jogo.jogadorDaVez.nome).toBe('Ana');
  });

  test('movimento comum, sem 6, captura ou chegada, não dá jogada extra', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.lancarDado(5);
    expect(jogo.mover(0).jogaDeNovo).toBe(false);
    expect(jogo.jogadorDaVez.nome).toBe('Bruno');
  });

  test('com 6 e nenhum movimento possível, o jogador lança de novo', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [53, 54, 55, CHEGADA]);
    expect(jogo.lancarDado(6)).toEqual({ valor: 6, movimentos: [], jogaDeNovo: true });
    expect(jogo.jogadorDaVez.nome).toBe('Ana');
    expect(jogo.lancarDado(1).movimentos).toEqual([0, 1, 2]);
  });

  test('com valor diferente de 6 e nenhum movimento possível, a vez passa', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [53, 54, 55, CHEGADA]);
    expect(jogo.lancarDado(4)).toEqual({ valor: 4, movimentos: [], passouAVez: true });
    expect(jogo.jogadorDaVez.nome).toBe('Bruno');
  });
});

describe('Três 6 seguidos', () => {
  test('o terceiro 6 seguido não move peça e faz o jogador perder a vez', () => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    jogo.mover(0);
    jogo.lancarDado(6);
    jogo.mover(0);
    expect(jogo.lancarDado(6)).toEqual({ valor: 6, movimentos: [], perdeuAVez: true });
    expect(jogo.jogadorDaVez.nome).toBe('Bruno');
    expect(jogo.jogadores[0].pecas[0]).toBe(6);
    expect(jogo.dado).toBeNull();
  });

  test('o terceiro 6 fica no histórico como vez perdida', () => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    jogo.mover(0);
    jogo.lancarDado(6);
    jogo.mover(0);
    jogo.lancarDado(6);
    expect(jogo.historico[jogo.historico.length - 1]).toEqual({ jogador: 'Ana', valor: 6, perdeuAVez: true });
  });

  test('6 sem movimento possível também conta para os três 6 seguidos', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [53, 54, 55, CHEGADA]);
    expect(jogo.lancarDado(6)).toEqual({ valor: 6, movimentos: [], jogaDeNovo: true });
    expect(jogo.lancarDado(6)).toEqual({ valor: 6, movimentos: [], jogaDeNovo: true });
    expect(jogo.lancarDado(6)).toEqual({ valor: 6, movimentos: [], perdeuAVez: true });
    expect(jogo.jogadorDaVez.nome).toBe('Bruno');
  });

  test('um valor diferente de 6 no meio zera a contagem', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 20), BASE, BASE, BASE]);
    jogo.lancarDado(6);
    jogo.mover(0);
    expect(jogo.seisSeguidos).toBe(1);
    jogo.lancarDado(4);
    expect(jogo.seisSeguidos).toBe(0);
    expect(jogo.mover(0)).toMatchObject({ casa: 20, capturou: 1, jogaDeNovo: true });
    jogo.lancarDado(6);
    expect(jogo.seisSeguidos).toBe(1);
    expect(jogo.jogadorDaVez.nome).toBe('Ana');
  });

  test('a contagem de 6 recomeça quando a vez muda', () => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    jogo.mover(0);
    jogo.lancarDado(6);
    jogo.mover(0);
    jogo.lancarDado(6);
    expect(jogo.seisSeguidos).toBe(0);
    jogo.lancarDado(6);
    expect(jogo.seisSeguidos).toBe(1);
    jogo.mover(0);
    expect(jogo.jogadorDaVez.nome).toBe('Bruno');
  });

  test('dois 6 seguidos ainda deixam o jogador jogar o terceiro lançamento normalmente', () => {
    const jogo = novaPartida();
    jogo.lancarDado(6);
    jogo.mover(0);
    jogo.lancarDado(6);
    jogo.mover(0);
    expect(jogo.seisSeguidos).toBe(2);
    expect(jogo.lancarDado(2).movimentos).toEqual([0]);
  });
});

describe('Captura', () => {
  test('cair na casa de uma peça adversária a manda de volta para a base', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 12), 30, BASE, BASE]);
    jogo.lancarDado(2);
    expect(jogo.mover(0)).toMatchObject({ casa: 12, capturou: 1 });
    expect(jogo.jogadores[1].pecas).toEqual([BASE, 30, BASE, BASE]);
    expect(jogo.jogadores[0].pecas[0]).toBe(12);
  });

  test('o amarelo também captura o vermelho', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [30, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [2, BASE, BASE, BASE]);
    jogo.lancarDado(1);
    jogo.mover(0);
    jogo.lancarDado(3);
    expect(jogo.mover(0)).toMatchObject({ casa: 31, capturou: 1, jogaDeNovo: true });
    expect(jogo.jogadores[0].pecas[0]).toBe(BASE);
    expect(jogo.jogadorDaVez.nome).toBe('Bruno');
  });

  test('só a peça da casa de chegada é capturada, não as peças por onde se passou', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 11), BASE, BASE, BASE]);
    jogo.lancarDado(4);
    expect(jogo.mover(0)).toMatchObject({ casa: 14, capturou: 0 });
    expect(jogo.jogadores[1].pecas[0]).toBe(progressoPara(jogo, 1, 11));
  });

  test('a última casa da trilha (50) é uma casa comum, onde se pode capturar', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [50, 10, BASE, BASE]);
    jogo.definirPosicoes(1, [20, BASE, BASE, BASE]);
    jogo.lancarDado(1);
    jogo.mover(1);
    jogo.lancarDado(4);
    expect(jogo.mover(0)).toMatchObject({ casa: 50, capturou: 1 });
    expect(jogo.jogadores[0].pecas).toEqual([BASE, 11, BASE, BASE]);
  });

  test('peça que cai em casa vazia não captura ninguém', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 30), BASE, BASE, BASE]);
    jogo.lancarDado(2);
    expect(jogo.mover(0).capturou).toBe(0);
  });
});

describe('Casas seguras', () => {
  test.each([8, 13, 21, 26, 34, 39, 47])('na casa segura %i ninguém é capturado', (casa) => {
    const jogo = novaPartida();
    const pecaAmarela = progressoPara(jogo, 1, casa);
    jogo.definirPosicoes(0, [progressoPara(jogo, 0, casa) - 2, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [pecaAmarela, BASE, BASE, BASE]);
    jogo.lancarDado(2);
    expect(jogo.mover(0)).toMatchObject({ casa, capturou: 0, jogaDeNovo: false });
    expect(jogo.casaNaTrilha(1, jogo.jogadores[1].pecas[0])).toBe(casa);
    expect(jogo.jogadores[1].pecas[0]).toBe(pecaAmarela);
  });

  test('o amarelo também não captura numa casa segura', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [8, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 6), BASE, BASE, BASE]);
    jogo.lancarDado(1);
    jogo.mover(0);
    jogo.lancarDado(2);
    expect(jogo.mover(0)).toMatchObject({ casa: 8, capturou: 0 });
    expect(jogo.jogadores[0].pecas[0]).toBe(9);
  });

  test('peças de cores diferentes podem dividir uma casa segura', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [6, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 8), BASE, BASE, BASE]);
    jogo.lancarDado(2);
    jogo.mover(0);
    expect(jogo.jogadores[0].pecas[0]).toBe(8);
    expect(jogo.casaNaTrilha(0, 8)).toBe(jogo.casaNaTrilha(1, jogo.jogadores[1].pecas[0]));
  });

  test('peças da mesma cor podem dividir a mesma casa', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [10, 12, BASE, BASE]);
    jogo.lancarDado(2);
    expect(jogo.mover(0).capturou).toBe(0);
    expect(jogo.jogadores[0].pecas).toEqual([12, 12, BASE, BASE]);
  });
});

describe('Bloco de duas peças', () => {
  test('duas peças da mesma cor na mesma casa não podem ser capturadas', () => {
    const jogo = novaPartida();
    const p = progressoPara(jogo, 1, 15);
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [p, p, BASE, BASE]);
    jogo.lancarDado(5);
    expect(jogo.mover(0)).toMatchObject({ casa: 15, capturou: 0, jogaDeNovo: false });
    expect(jogo.jogadores[1].pecas).toEqual([p, p, BASE, BASE]);
    expect(jogo.jogadores[0].pecas[0]).toBe(15);
  });

  test('três peças juntas também são um bloco', () => {
    const jogo = novaPartida();
    const p = progressoPara(jogo, 1, 15);
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [p, p, p, BASE]);
    jogo.lancarDado(5);
    expect(jogo.mover(0).capturou).toBe(0);
    expect(jogo.jogadores[1].pecas).toEqual([p, p, p, BASE]);
  });

  test('o vermelho também forma bloco contra o amarelo', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [30, 30, 10, BASE]);
    jogo.definirPosicoes(1, [2, BASE, BASE, BASE]);
    jogo.lancarDado(1);
    jogo.mover(2);
    jogo.lancarDado(2);
    expect(jogo.mover(0)).toMatchObject({ casa: 30, capturou: 0 });
    expect(jogo.jogadores[0].pecas).toEqual([30, 30, 11, BASE]);
  });

  test('não há bloqueio de passagem: o adversário passa por cima do bloco', () => {
    const jogo = novaPartida();
    const p = progressoPara(jogo, 1, 15);
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [p, p, BASE, BASE]);
    expect(jogo.lancarDado(6).movimentos).toContain(0);
    expect(jogo.mover(0)).toMatchObject({ casa: 16, capturou: 0 });
  });

  test('o bloco se desfaz quando uma das peças sai, e a que ficou pode ser capturada', () => {
    const jogo = novaPartida();
    const p = progressoPara(jogo, 1, 15);
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [p, p, BASE, BASE]);
    jogo.lancarDado(1);
    jogo.mover(0);
    jogo.lancarDado(2);
    jogo.mover(0);
    expect(jogo.jogadores[1].pecas).toEqual([p + 2, p, BASE, BASE]);
    jogo.lancarDado(4);
    expect(jogo.mover(0)).toMatchObject({ casa: 15, capturou: 1 });
    expect(jogo.jogadores[1].pecas).toEqual([p + 2, BASE, BASE, BASE]);
  });

  test('uma peça sozinha na casa não é bloco: é capturada', () => {
    const jogo = novaPartida();
    const p = progressoPara(jogo, 1, 15);
    jogo.definirPosicoes(0, [10, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [p, BASE, BASE, BASE]);
    jogo.lancarDado(5);
    expect(jogo.mover(0)).toMatchObject({ casa: 15, capturou: 1 });
  });
});

describe('Reta final', () => {
  test('depois da casa 50 a peça sai da trilha e entra na reta final da sua cor', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [48, BASE, BASE, BASE]);
    jogo.lancarDado(5);
    expect(jogo.mover(0)).toMatchObject({ de: 48, para: 53, casa: null });
  });

  test('a entrada na reta final vale também para o amarelo', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(1, [48, BASE, BASE, BASE]);
    jogo.lancarDado(1);
    jogo.lancarDado(3);
    expect(jogo.mover(0)).toMatchObject({ de: 48, para: 51, casa: null });
  });

  test('a peça no progresso 51 já está na reta final', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [50, BASE, BASE, BASE]);
    jogo.lancarDado(1);
    expect(jogo.mover(0)).toMatchObject({ para: 51, casa: null });
  });

  test('peça na reta final não pode ser capturada', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [1, BASE, BASE, BASE]);
    jogo.definirPosicoes(1, [55, BASE, BASE, BASE]);
    jogo.lancarDado(2);
    expect(jogo.mover(0)).toMatchObject({ casa: 3, capturou: 0 });
    expect(jogo.jogadores[1].pecas[0]).toBe(55);
  });

  test('o vermelho na reta final também não é capturado pelo amarelo', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [55, 10, BASE, BASE]);
    jogo.definirPosicoes(1, [progressoPara(jogo, 1, 1), BASE, BASE, BASE]);
    jogo.lancarDado(1);
    jogo.mover(1);
    jogo.lancarDado(2);
    expect(jogo.mover(0)).toMatchObject({ casa: 3, capturou: 0 });
    expect(jogo.jogadores[0].pecas[0]).toBe(55);
  });
});

describe('Chegada ao centro', () => {
  test('chegar ao centro exige o valor exato', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [54, BASE, BASE, BASE]);
    expect(jogo.lancarDado(3)).toEqual({ valor: 3, movimentos: [], passouAVez: true });
    jogo.lancarDado(1);
    jogo.lancarDado(2);
    expect(jogo.mover(0)).toMatchObject({ para: CHEGADA, chegou: true, casa: null });
  });

  test('de 50, o 6 leva exatamente ao centro', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [50, BASE, BASE, BASE]);
    expect(jogo.lancarDado(6).movimentos).toEqual([0, 1, 2, 3]);
    expect(jogo.mover(0)).toMatchObject({ para: CHEGADA, chegou: true });
  });

  test('peça que chegou ao centro não anda mais', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [CHEGADA, 10, BASE, BASE]);
    expect(jogo.lancarDado(1).movimentos).toEqual([1]);
  });

  test('peça que passaria do centro não pode andar, mas as outras podem', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [55, 10, BASE, BASE]);
    expect(jogo.lancarDado(2).movimentos).toEqual([1]);
  });

  test('chegar ao centro sem tirar 6 dá jogada extra, mas só uma peça por vez chega', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [54, 55, BASE, BASE]);
    jogo.lancarDado(2);
    expect(jogo.mover(0).chegou).toBe(true);
    expect(jogo.jogadores[0].pecas).toEqual([CHEGADA, 55, BASE, BASE]);
    expect(jogo.jogadorDaVez.nome).toBe('Ana');
  });
});

describe('Vitória', () => {
  test('quem leva as 4 peças ao centro vence', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [CHEGADA, CHEGADA, CHEGADA, 55]);
    jogo.lancarDado(1);
    expect(jogo.mover(3)).toMatchObject({ chegou: true, vitoria: true });
    expect(jogo.estado).toBe('fim');
    expect(jogo.vencedor).toBe('Ana');
    expect(jogo.dado).toBeNull();
  });

  test('o segundo jogador também pode vencer', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(1, [CHEGADA, CHEGADA, CHEGADA, 50]);
    jogo.lancarDado(1);
    jogo.lancarDado(6);
    expect(jogo.mover(3)).toMatchObject({ vitoria: true });
    expect(jogo.vencedor).toBe('Bruno');
  });

  test('com 3 peças no centro o jogo continua', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [CHEGADA, CHEGADA, CHEGADA, 50]);
    jogo.lancarDado(1);
    jogo.mover(3);
    expect(jogo.estado).toBe('jogando');
    expect(jogo.vencedor).toBeNull();
  });

  test('depois do fim nenhuma jogada é aceita', () => {
    const jogo = novaPartida();
    jogo.definirPosicoes(0, [CHEGADA, CHEGADA, CHEGADA, 55]);
    jogo.lancarDado(1);
    jogo.mover(3);
    expect(() => jogo.lancarDado(3)).toThrow('A partida já terminou');
    expect(() => jogo.mover(0)).toThrow('A partida já terminou');
    expect(jogo.movimentosPossiveis()).toEqual([]);
  });
});

describe('Partidas simuladas', () => {
  function escolherPeca(jogo, movimentos) {
    const pecas = jogo.jogadorDaVez.pecas;
    const adversario = jogo.jogadores[1 - jogo.vez];
    const captura = movimentos.find((i) => {
      const para = pecas[i] === BASE ? 0 : pecas[i] + jogo.dado;
      const casa = jogo.casaNaTrilha(jogo.vez, para);
      if (casa === null || CASAS_SEGURAS.includes(casa)) return false;
      return adversario.pecas.filter((q) => jogo.casaNaTrilha(1 - jogo.vez, q) === casa).length === 1;
    });
    if (captura !== undefined) return captura;
    const daBase = movimentos.find((i) => pecas[i] === BASE);
    if (daBase !== undefined) return daBase;
    return movimentos.reduce((melhor, i) => (pecas[i] > pecas[melhor] ? i : melhor));
  }

  function jogarAteOFim(semente) {
    const jogo = new Ludo({ nomes: ['Ana', 'Bruno'], dado: dadoComSemente(semente) });
    let lancamentos = 0;
    while (jogo.estado === 'jogando') {
      const { movimentos } = jogo.lancarDado();
      if (movimentos.length > 0) jogo.mover(escolherPeca(jogo, movimentos));
      lancamentos++;
      if (lancamentos > 20000) throw new Error('A partida não terminou');
      for (const j of jogo.jogadores) {
        expect(j.pecas).toHaveLength(4);
        j.pecas.forEach((p) => expect(p >= BASE && p <= CHEGADA).toBe(true));
      }
    }
    return jogo;
  }

  test.each([1, 2, 3, 7, 42, 2026])('partida sorteada vai até o fim com um vencedor (semente %i)', (semente) => {
    const jogo = jogarAteOFim(semente);
    const vencedor = jogo.jogadores.find((j) => j.nome === jogo.vencedor);
    const perdedor = jogo.jogadores.find((j) => j.nome !== jogo.vencedor);
    expect(jogo.estado).toBe('fim');
    expect(vencedor.pecas).toEqual([CHEGADA, CHEGADA, CHEGADA, CHEGADA]);
    expect(perdedor.pecas.every((p) => p === CHEGADA)).toBe(false);
    expect(jogo.historico.length).toBeGreaterThan(0);
  });

  test('a mesma semente produz a mesma partida', () => {
    const a = jogarAteOFim(99);
    const b = jogarAteOFim(99);
    expect(a.vencedor).toBe(b.vencedor);
    expect(a.historico).toEqual(b.historico);
  });

  test('em toda partida o vencedor registra 4 chegadas ao centro no histórico', () => {
    const jogo = jogarAteOFim(5);
    const chegadas = jogo.historico.filter((h) => h.jogador === jogo.vencedor && h.chegou);
    expect(chegadas).toHaveLength(4);
  });

  test('toda captura do histórico manda uma peça adversária de volta para a base', () => {
    const jogo = jogarAteOFim(8);
    const capturas = jogo.historico.filter((h) => h.capturou > 0);
    expect(capturas.length).toBeGreaterThan(0);
    capturas.forEach((h) => expect(h.casa).not.toBeNull());
    capturas.forEach((h) => expect(CASAS_SEGURAS).not.toContain(h.casa));
  });
});
