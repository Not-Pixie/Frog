-- Permitimos inserir logs (triggers do app normalmente escrevem com alterado_por = app_usuario_id())
CREATE POLICY logs_insert ON logs FOR INSERT
  WITH CHECK (alterado_por = app_usuario_id());

-- SELECT: só admins globais (por exemplo, usuários listados em uma role ou condição)
CREATE POLICY logs_select ON logs FOR SELECT
  USING (
    -- exemplo: só proprietarios de comercios ou se o usuário é super admin (você define a condição)
    EXISTS (
      SELECT 1 FROM comercios c
      WHERE c.proprietario_id = app_usuario_id()
      AND c.comercio_id = logs.tabela_nome::int -- somente se tabela for comercio: exemplo apenas ilustrativo
    )
    -- adapte essa expressão à sua realidade; você pode ter uma tabela de admins globais
  );
