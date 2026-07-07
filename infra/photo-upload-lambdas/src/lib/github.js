/**
 * Minimal GitHub Git Data API client used to commit the generated post in a
 * single commit (index.md). Authenticates with a
 * fine-grained token that has `contents: write` on the repo. Uses the global
 * fetch available in the Node 20 Lambda runtime — no extra dependencies.
 */

const API = 'https://api.github.com';

function makeRequest(token) {
  return async function gh(method, urlPath, body) {
    const res = await fetch(`${API}${urlPath}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'micahwalter-photo-upload',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`GitHub ${method} ${urlPath} failed: ${res.status} ${text}`);
    }
    return res.json();
  };
}

/**
 * Read a UTF-8 text file from the repo at a given ref. Returns null on 404.
 */
async function getTextFile(token, repo, branch, filePath) {
  const res = await fetch(`${API}/repos/${repo}/contents/${filePath}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'micahwalter-photo-upload',
    },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub read ${filePath} failed: ${res.status}`);
  const data = await res.json();
  return Buffer.from(data.content, 'base64').toString('utf8');
}

/**
 * Commit one or more UTF-8 text files to the branch in a single commit.
 *
 * @param {object} opts
 * @param {string} opts.token
 * @param {string} opts.repo    "owner/name"
 * @param {string} opts.branch
 * @param {string} opts.message
 * @param {Array<{ path: string, content: string }>} opts.files
 * @returns {Promise<string>} the new commit SHA
 */
async function commitFiles({ token, repo, branch, message, files }) {
  const gh = makeRequest(token);

  const ref = await gh('GET', `/repos/${repo}/git/ref/heads/${branch}`);
  const baseCommitSha = ref.object.sha;

  const baseCommit = await gh('GET', `/repos/${repo}/git/commits/${baseCommitSha}`);
  const baseTreeSha = baseCommit.tree.sha;

  const tree = [];
  for (const file of files) {
    const blob = await gh('POST', `/repos/${repo}/git/blobs`, {
      content: Buffer.from(file.content, 'utf8').toString('base64'),
      encoding: 'base64',
    });
    tree.push({ path: file.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  const newTree = await gh('POST', `/repos/${repo}/git/trees`, {
    base_tree: baseTreeSha,
    tree,
  });

  const commit = await gh('POST', `/repos/${repo}/git/commits`, {
    message,
    tree: newTree.sha,
    parents: [baseCommitSha],
  });

  await gh('PATCH', `/repos/${repo}/git/refs/heads/${branch}`, { sha: commit.sha });

  return commit.sha;
}

module.exports = { getTextFile, commitFiles };
