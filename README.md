# RGTA — Ranking Geral de Tênis Amador

Aplicativo web para gerenciar o ranking da liga amadora de tênis (4ª Edição 2026).
Jogadores se cadastram, registram partidas e acompanham o ranking por categoria em tempo real.

**Stack:** React + Vite (front-end) · Supabase (autenticação + banco Postgres) · Vercel (hospedagem).

## Funcionalidades
- Cadastro e login (Supabase Auth).
- Início com posição no ranking, pontos e últimos resultados.
- Ranking por categoria (A, B, C), com o jogador em destaque.
- Registro de partidas com placar por set — os pontos e o ranking são calculados automaticamente no banco.
- Histórico de partidas com gráfico de evolução de pontos.
- Perfil com estatísticas (vitórias/derrotas, aproveitamento, melhor ranking).

### Como os pontos funcionam
Vencedor ganha **+20** pontos e o perdedor perde **−12**. Todo jogador começa com **1000** pontos.
O cálculo é feito por uma função no banco (`register_match`), garantindo consistência mesmo que dois jogadores registrem.

## Rodar localmente
```bash
npm install
cp .env.example .env   # já vem preenchido com as chaves públicas do projeto
npm run dev
```

## Variáveis de ambiente
| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave publishable/anon (segura para o front; os dados são protegidos por RLS) |

No deploy (Vercel), configure essas duas variáveis. Se não configuradas, o app usa os valores padrão embutidos do projeto RGTA.

## Banco de dados (Supabase)
- `profiles` — um registro por jogador (nome, categoria, pontos, vitórias, derrotas).
- `matches` — partidas (dupla entrada: uma linha por jogador).
- `rankings` — view que ordena os jogadores por pontos dentro de cada categoria.
- `register_match(...)` — função que registra a partida e atualiza os pontos dos dois jogadores.
- Segurança por RLS: cada jogador só edita o próprio perfil; partidas só entram pela função.
