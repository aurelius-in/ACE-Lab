import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const PRESETS_PATH = path.join(DATA_DIR, 'presets.json');

async function ensureData(){
	await fs.mkdir(DATA_DIR, { recursive: true });
	try { await fs.access(PRESETS_PATH); } catch { await fs.writeFile(PRESETS_PATH, '[]', 'utf-8'); }
}

async function readPresets(){ await ensureData(); const txt = await fs.readFile(PRESETS_PATH, 'utf-8'); return JSON.parse(txt || '[]'); }
async function writePresets(list){ await ensureData(); await fs.writeFile(PRESETS_PATH, JSON.stringify(list, null, 2), 'utf-8'); }

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_, res)=> res.json({ ok: true }));

app.get('/presets', async (_, res) => { const list = await readPresets(); res.json(list); });
app.post('/presets', async (req, res) => { const list = await readPresets(); const p = req.body; if (!p || !p.id) { return res.status(400).json({ error: 'invalid' }); } list.push(p); await writePresets(list); res.json(p); });
app.put('/presets/:id', async (req, res) => { const id = req.params.id; const list = await readPresets(); const i = list.findIndex(x=>x.id===id); if (i<0) return res.status(404).json({ error: 'not_found' }); list[i] = { ...list[i], ...req.body, id }; await writePresets(list); res.json(list[i]); });
app.delete('/presets/:id', async (req, res) => { const id = req.params.id; const list = await readPresets(); const next = list.filter(x=>x.id!==id); await writePresets(next); res.json({ ok: true }); });

const port = process.env.PORT || 4000;
app.listen(port, ()=> console.log(`[server] listening on http://localhost:${port}`));
