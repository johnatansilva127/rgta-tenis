# RGTA — Ranking Geral de Tênis Amador

Aplicativo web para gerenciar o ranking da liga amadora de tênis (4ª Edição 2026).
Jogadores se cadastram, registram partidas (com aprovação do administrador) e acompanham o ranking por categoria.

**Stack:** React + Vite (front-end) · Supabase (auth + Postgres + Edge Functions) · Vercel (hospedagem).

## Funcionalidades
- Cadastro e login (acesso imediato, sem confirmação de e-mail).
- Início com posição, pontos e últimos resultados (com status de aprovação).
- Ranking por categoria (A, B, C).
- Registro de partidas: o jogador envia o placar e o administrador aprova para valer.
- Painel do administrador: aprovar/recusar partidas, gerenciar jogadores (categoria/admin) e lançar partidas já aprovadas.
- Histórico com gráfico de evolução e perfil com estatísticas.

## Sistema de pontos
Todo jogador começa com **1000** pontos. Ninguém perde pontos — todos somam (vencedores somam mais).

**Mesma categoria:** vencedor **+10**, perdedor **+3** (ou **+4** se perdeu no super tiebreak).

**Jogo extra (categorias diferentes — A só joga com A/B, B com A/B/C, C com B/C):**
- Vencer um adversário de categoria acima: **+15**
- Vencer um adversário de categoria abaixo: **+5**
- Perder (para cima ou para baixo): **+2** (ou **+3** se perdeu no super tiebreak)
- O vencedor não muda em caso de super tiebreak.

Os pontos só entram no ranking **após a aprovação** do administrador (partidas lançadas pelo admin já entram aprovadas).

## Rodar localmente
```bash
npm install
cp .env.example .env
npm run dev
```

## Banco (Supabase)
- `profiles` — jogadores (nome, categoria, pontos, vitórias, derrotas, is_admin).
- `matches` — partidas com status (pending/approved/rejected) e pontos calculados.
- `rankings` — view que ordena por pontos dentro da categoria.
- Funções: `register_match`, `approve_match`, `reject_match`, `admin_create_match`, `admin_update_player`, `admin_set_admin`, `calc_points`.
- Edge Function `signup` cria o jogador já confirmado (sem e-mail).
- Segurança por RLS; ações sensíveis exigem admin.
