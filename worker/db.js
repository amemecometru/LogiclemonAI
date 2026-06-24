export async function getOrCreateUser(env, email, provider, principal) {
  if (!env.DB) return null;
  let user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) {
    const { success } = await env.DB.prepare(
      'INSERT INTO users (principal, email, provider, last_sign_in) VALUES (?, ?, ?, datetime(\'now\'))'
    ).bind(principal, email, provider).run();
    if (!success) return null;
    user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  } else {
    await env.DB.prepare(
      'UPDATE users SET principal = ?, last_sign_in = datetime(\'now\'), provider = ? WHERE id = ?'
    ).bind(principal, provider, user.id).run();
  }
  return user;
}

export async function storeAuthKey(env, key, userId) {
  if (!env.DB) return;
  await env.DB.prepare(
    'INSERT OR IGNORE INTO auth_keys (key, user_id) VALUES (?, ?)'
  ).bind(key, userId).run();
}

export async function getUserByPrincipal(env, principal) {
  if (!env.DB) return null;
  return env.DB.prepare('SELECT * FROM users WHERE principal = ?').bind(principal).first();
}

export async function getUserByKey(env, key) {
  if (!env.DB) return null;
  return env.DB.prepare(
    'SELECT u.* FROM users u JOIN auth_keys k ON u.id = k.user_id WHERE k.key = ?'
  ).bind(key).first();
}

export async function saveGeneration(env, userId, prompt, model, code) {
  if (!env.DB) return false;
  const { success } = await env.DB.prepare(
    'INSERT INTO generations (user_id, prompt, model, code) VALUES (?, ?, ?, ?)'
  ).bind(userId, prompt, model, code).run();
  return success;
}

export async function getGenerations(env, userId, limit = 20) {
  if (!env.DB) return [];
  const { results } = await env.DB.prepare(
    'SELECT id, prompt, model, created_at FROM generations WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).bind(userId, limit).all();
  return results;
}

export async function updatePreferences(env, userId, prefs) {
  if (!env.DB) return;
  await env.DB.prepare(
    'UPDATE users SET preferences = ? WHERE id = ?'
  ).bind(JSON.stringify(prefs), userId).run();
}

export async function getProjects(env, userId) {
  if (!env.DB) return [];
  const { results } = await env.DB.prepare(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all();
  return results;
}

export async function createProject(env, userId, name, description) {
  if (!env.DB) return null;
  const { success } = await env.DB.prepare(
    'INSERT INTO projects (user_id, name, description) VALUES (?, ?, ?)'
  ).bind(userId, name, description || '').run();
  if (!success) return null;
  return env.DB.prepare(
    'SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(userId).first();
}

export async function deleteGeneration(env, generationId, userId) {
  if (!env.DB) return false;
  const { success } = await env.DB.prepare(
    'DELETE FROM generations WHERE id = ? AND user_id = ?'
  ).bind(generationId, userId).run();
  return success;
}

export async function deleteProject(env, projectId, userId) {
  if (!env.DB) return false;
  await env.DB.prepare('DELETE FROM project_generations WHERE project_id = ?').bind(projectId).run();
  const { success } = await env.DB.prepare(
    'DELETE FROM projects WHERE id = ? AND user_id = ?'
  ).bind(projectId, userId).run();
  return success;
}
