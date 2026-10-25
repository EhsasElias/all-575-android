// Keeps this app's copy of the backend's API contract honest.
//
// The contract (docs/api/openapi.json) is owned by the backend repository. This app keeps a copy of it, and
// api-contract.json says exactly which backend commit that copy comes from and its SHA-256.
//
//   node scripts/api-contract.mjs check    the copy matches the lock, and the lock matches the backend at that commit
//   node scripts/api-contract.mjs update   take the contract from the backend's branch head (or `update <commit>`)
//   node scripts/api-contract.mjs latest   fail if the backend's branch has moved past the pinned commit
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const LOCK_FILE = new URL('../api-contract.json', import.meta.url);
const COPY_FILE = new URL('../docs/api/openapi.json', import.meta.url);

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readLock = async () => JSON.parse(await readFile(LOCK_FILE, 'utf8'));

async function download(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'all-575-android contract check' },
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response;
}

const contractUrl = (lock, ref) =>
  `https://raw.githubusercontent.com/${lock.repository}/${ref}/${lock.path}`;

// `git ls-remote` instead of the GitHub API: no rate limit, and it works wherever git can reach the repository.
function branchHead(lock) {
  const output = execFileSync(
    'git',
    ['ls-remote', `https://github.com/${lock.repository}.git`, `refs/heads/${lock.branch}`],
    {
      encoding: 'utf8',
    },
  );
  const sha = output.split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/.test(sha))
    throw new Error(`${lock.repository} has no branch ${lock.branch}`);
  return sha;
}

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

async function check() {
  const lock = await readLock();
  const local = sha256(await readFile(COPY_FILE));
  if (local !== lock.sha256) {
    fail(
      `docs/api/openapi.json (${local}) is not the version api-contract.json pins (${lock.sha256}). ` +
        'Do not edit it by hand: run `npm run api:update`.',
    );
  }
  const remote = sha256(
    Buffer.from(await (await download(contractUrl(lock, lock.ref))).arrayBuffer()),
  );
  if (remote !== lock.sha256) {
    fail(
      `api-contract.json does not match ${lock.repository} at ${lock.ref}. Run \`npm run api:update\`.`,
    );
  }
  console.log(
    `✔ API contract is ${lock.repository}@${lock.ref.slice(0, 7)} (${lock.sha256.slice(0, 12)}…)`,
  );
}

async function update(requestedRef) {
  const lock = await readLock();
  const ref = requestedRef ?? branchHead(lock);
  const bytes = Buffer.from(await (await download(contractUrl(lock, ref))).arrayBuffer());
  JSON.parse(bytes.toString('utf8'));
  await writeFile(COPY_FILE, bytes);
  await writeFile(
    LOCK_FILE,
    `${JSON.stringify({ ...lock, ref, sha256: sha256(bytes) }, null, 2)}\n`,
  );
  console.log(
    `✔ Pinned ${lock.repository}@${ref.slice(0, 7)}. Now regenerate the types: npm run api:types`,
  );
}

async function latest() {
  const lock = await readLock();
  const head = branchHead(lock);
  if (head === lock.ref) {
    console.log(`✔ Pinned contract is the newest on ${lock.repository}:${lock.branch}`);
    return;
  }
  // The backend moving on is not always a contract change: compare the contract itself.
  const newest = sha256(Buffer.from(await (await download(contractUrl(lock, head))).arrayBuffer()));
  if (newest === lock.sha256) {
    console.log(
      `✔ ${lock.repository}:${lock.branch} has new commits, but the contract is unchanged`,
    );
    return;
  }
  fail(
    `${lock.repository}:${lock.branch} has a newer API contract. Run \`npm run api:update\`, then fix what breaks.`,
  );
}

const [command = 'check', argument] = process.argv.slice(2);
const commands = { check, update: () => update(argument), latest };
if (!(command in commands)) fail(`Unknown command "${command}". Use check, update or latest.`);
await commands[command]().catch((error) => fail(error.message));
