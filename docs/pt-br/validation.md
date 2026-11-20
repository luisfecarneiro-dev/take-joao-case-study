# Validação e roteiro de entrevista

[Português](../../README.md) · [English](../en/validation.md)

## Estado documentado em novembro de 2026

| Camada | Registro histórico |
| --- | --- |
| Software | Testes automatizados e integração da estação registrados no relatório do projeto. |
| Publicação | Código do motor publicado com a ativação desligada. A API de estação foi exercitada. |
| Homologação física | Ativação em loja sujeita a teste de equipamento e papel. O relatório consultado registrava essa etapa como pendente. |

**Proveniência.** Consultei a arquitetura do motor, a decisão de liberação e o roteiro de homologação no GitHub em 20/11/2026. O estudo descreve o recorte registrado pelos documentos.

## Demonstração do pacote

Rode `node --test example/receipt-job.test.mjs`. Os cenários cobrem aceitação no transporte, vínculo com a tentativa, recuperação de uma reserva que expira antes do envio, expiração durante o envio e recusa de reenvio automático após incerteza. O exemplo usa eventos sintéticos, zero dependências externas e zero acesso a hardware.

## Em uma entrevista

1. Mostre o instante em que uma falha de comunicação pode deixar a impressão incerta.
2. Explique a diferença entre perder a reserva antes de enviar e perder a resposta depois de começar o envio.
3. Descreva como homologaria a saída física, a legibilidade do recibo e o comportamento em uma queda de conexão.
