import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const PRESETS_PATH = path.join(DATA_DIR, 'presets.json');

async function ensureData(){
	await fs.mkdir(DATA_DIR, { recursive: true });
	await fs.mkdir(UPLOADS_DIR, { recursive: true });
	try { await fs.access(PRESETS_PATH); } catch { await fs.writeFile(PRESETS_PATH, '[]', 'utf-8'); }
}

async function readPresets(){ await ensureData(); const txt = await fs.readFile(PRESETS_PATH, 'utf-8'); return JSON.parse(txt || '[]'); }
async function writePresets(list){ await ensureData(); await fs.writeFile(PRESETS_PATH, JSON.stringify(list, null, 2), 'utf-8'); }

const upload = multer({ dest: UPLOADS_DIR });

export const app = express();
app.use(cors());
app.use(express.json());
app.use('/files', express.static(UPLOADS_DIR));

app.get('/health', (_, res)=> res.json({ ok: true }));

// Presets CRUD
app.get('/presets', async (_, res) => { const list = await readPresets(); res.json(list); });
app.post('/presets', async (req, res) => { const list = await readPresets(); const p = req.body; if (!p || !p.id || !p.name || typeof p.params !== 'object') { return res.status(400).json({ error: 'invalid' }); } list.push(p); await writePresets(list); res.json(p); });
app.put('/presets/:id', async (req, res) => { const id = req.params.id; const list = await readPresets(); const i = list.findIndex(x=>x.id===id); if (i<0) return res.status(404).json({ error: 'not_found' }); list[i] = { ...list[i], ...req.body, id }; await writePresets(list); res.json(list[i]); });
app.delete('/presets/:id', async (req, res) => { const id = req.params.id; const list = await readPresets(); const next = list.filter(x=>x.id!==id); await writePresets(next); res.json({ ok: true }); });

// Upload file (local storage) and return URL
app.post('/upload', upload.single('file'), async (req, res) => {
	if (!req.file) return res.status(400).json({ error: 'no_file' });
	const url = `/files/${req.file.filename}`;
	res.json({ url });
});

// Policy audit (minimal)
app.post('/policy/audit', (req, res) => {
	const { width, height, device } = req.body || {};
	const violations = [];
	let fix;
	if (device === 'mobile') {
		if (Number(width) > 1920 || Number(height) > 1920) {
			violations.push('Mobile export exceeds 1080p width policy');
			fix = { width: 1920 };
		}
	}
	const allowed = violations.length === 0;
	res.json({ allowed, violations, fix });
});

if (process.env.NODE_ENV !== 'test') {
	const port = process.env.PORT || 4000;
	app.listen(port, ()=> console.log(`[server] listening on http://localhost:${port}`));
}
