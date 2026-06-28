import Icon from './Icon.jsx'

export default function Legal({ onClose }) {
  return (
    <div className="login" style={{ justifyContent: 'flex-start', overflowY: 'auto', textAlign: 'left', padding: 0 }}>
      <div className="topbar" style={{ width: '100%' }}><div className="row">
        <button className="ic" onClick={onClose} aria-label="Voltar"><Icon name="chevronLeft" size={22} /></button>
        <h3>Privacidade e Termos</h3><div style={{ width: 34 }} />
      </div></div>
      <div className="legal">
        <h2>Política de Privacidade e Termos de Uso — RGTA</h2>
        <p className="muted">Última atualização: 2026. Responsável (controlador): <b>Johnatan Silva</b> · Contato: <b>johnatansilva127@outlook.com</b>.</p>

        <h3>1. Quais dados coletamos</h3>
        <p>Nome, e-mail, categoria, foto de perfil (opcional) e os resultados das suas partidas (placar, datas, adversários e pontos). Não coletamos dados sensíveis nem mais do que o necessário para o ranking.</p>

        <h3>2. Para que usamos</h3>
        <p>Exclusivamente para operar o Ranking Geral de Tênis Amador (RGTA): exibir a classificação, estatísticas e o histórico de partidas da liga.</p>

        <h3>3. Base legal (LGPD)</h3>
        <p>Tratamos seus dados com base no seu <b>consentimento</b> (art. 7º, I) e na <b>execução do contrato</b> de participação na liga (art. 7º, V).</p>

        <h3>4. Compartilhamento</h3>
        <p>Não vendemos nem compartilhamos seus dados com terceiros para marketing. Os dados ficam hospedados nos provedores de infraestrutura (Supabase e Vercel), usados apenas para operar o app. Seu nome, categoria, foto e posição no ranking são visíveis aos demais participantes da liga.</p>

        <h3>5. Segurança</h3>
        <p>Senhas protegidas por hash, conexões criptografadas (HTTPS), acesso aos dados restrito por regras de segurança no banco (RLS) e funções administrativas limitadas. Os jogadores não conseguem alterar os próprios pontos.</p>

        <h3>6. Retenção e exclusão</h3>
        <p>Mantemos seus dados enquanto você participar da liga. Você pode solicitar a exclusão da sua conta a qualquer momento (no Perfil ou pelo contato acima); a exclusão é realizada pelo administrador e remove seus dados pessoais e fotos.</p>

        <h3>7. Seus direitos</h3>
        <p>Você tem direito a: acessar, corrigir, excluir, portar (baixar) seus dados, saber como são usados e revogar o consentimento. Use as opções na aba <b>Perfil</b> ou contate o responsável.</p>

        <h3>8. Cookies e armazenamento</h3>
        <p>Usamos armazenamento local apenas para manter sua sessão (login). Não usamos cookies de rastreamento ou publicidade.</p>

        <h3>9. Termos de Uso</h3>
        <p>O jogador é responsável pela veracidade dos resultados informados. As partidas são confirmadas pelo adversário e validadas pelo administrador. O uso indevido (resultados falsos, uso da conta de terceiros) pode levar à exclusão da liga.</p>

        <h3>10. Alterações</h3>
        <p>Esta política pode ser atualizada; mudanças relevantes serão avisadas no app.</p>

        <p className="muted">Dúvidas ou pedidos: Johnatan Silva — johnatansilva127@outlook.com.</p>
      </div>
    </div>
  )
}
