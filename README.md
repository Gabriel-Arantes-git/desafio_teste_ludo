# desafio_teste_ludo

Casos de teste em JavaScript (Jest) para **uma partida de Ludo para 2 jogadores**.

## Especificação do desafio

> Ludo (by Vini)
> - casos de teste para testar uma partida para 02 jogadores;
> - casos de teste em Javascript para testar Javascript.

## Colaboradores

| Nome | RA |
|---|---|
| Gabriel Arantes | 24169751-2 |
| Filipe Ruiz Boligon | 24042069-2 |

## Como executar

Requer Node.js 18 ou superior.

```bash
npm install
npm test
```

## Para fazer TDD

Os testes em [`ludo.test.js`](ludo.test.js) são a especificação. O arquivo [`ludo.js`](ludo.js) é só uma implementação de referência: pode ser apagado e reescrito a partir dos testes. O dado é injetável (`dado` no construtor ou valor passado a `lancarDado`), então toda jogada é previsível.

## Regras do jogo (todas cobertas pelos testes)

- **Tabuleiro**: trilha de 52 casas. Vermelho sai da casa 0 e amarelo da casa 26, em lados opostos. O vermelho joga primeiro.
- **Peças**: 4 por jogador, todas começam na base. Posição de cada peça (progresso): `-1` base, `0` a `50` trilha, `51` a `55` reta final, `56` centro.
- **Dado**: de 1 a 6. Não se lança de novo antes de mover, nem se move sem lançar.
- **Saída**: só sai da base quem tira 6, e a peça vai para a casa de saída da sua cor.
- **Jogada extra**: quem tira 6, captura uma peça ou leva uma peça ao centro joga de novo.
- **Três 6 seguidos**: a terceira jogada não vale e o jogador perde a vez. Um 6 sem movimento possível também conta.
- **Sem movimento**: a vez passa. Se o valor foi 6, o jogador lança de novo.
- **Captura**: peça que cai numa casa ocupada por uma única peça adversária a manda de volta para a base.
- **Casas seguras**: `0, 8, 13, 21, 26, 34, 39, 47`. Nelas ninguém é capturado.
- **Bloco**: duas ou mais peças da mesma cor na mesma casa não podem ser capturadas. Não há bloqueio de passagem.
- **Reta final**: depois de 51 passos a peça entra na reta final da sua cor, onde ninguém captura.
- **Chegada**: ao centro só com o valor exato. Peça no centro não anda mais.
- **Vitória**: quem levar as 4 peças ao centro primeiro. Depois do fim, nenhuma jogada é aceita.

## Funcionamento dos casos de teste

Os cenários usam `definirPosicoes` para chegar direto a uma situação (por exemplo, uma peça a dois passos do centro) e `progressoPara` para posicionar uma peça numa casa absoluta da trilha. Os valores esperados foram calculados à mão.

| Grupo | O que verifica |
|---|---|
| Início da partida | 2 jogadores, cores, peças na base, vermelho começa |
| Posição das peças na trilha | Casa absoluta de cada progresso, volta pela casa 51 |
| Dado | Valores válidos, dado injetado, lançar e mover na ordem certa |
| Saída da base | Só com 6, casa de saída de cada cor |
| Movimento | Andar o valor do dado, passar a vez |
| Jogada extra | 6, captura e chegada ao centro |
| Três 6 seguidos | Perde a vez, contagem zera, 6 sem movimento conta |
| Captura | Nos dois sentidos, peça volta à base, jogada extra |
| Casas seguras | Nenhuma captura nelas |
| Bloco de duas peças | Não é capturado, passagem livre |
| Reta final | Entrada, sem captura |
| Chegada ao centro | Valor exato, peça no centro não anda |
| Vitória | 4 peças no centro, 3 não bastam, nada é aceito depois |
| Partidas simuladas | Partidas sorteadas até o fim, com várias sementes |
