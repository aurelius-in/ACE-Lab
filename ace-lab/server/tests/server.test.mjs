import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { app } from '../index.mjs';

let server, baseUrl;

before(async () => {
	await new Promise((resolve) => {
		server = http.createServer(app).listen(0, () => {
			const { port } = server.address();
			baseUrl = `http://127.0.0.1:${port}`;
			resolve();
		});
	});
});

after(async () => {
	await new Promise((resolve) => server.close(() => resolve()));
});

test('health returns ok', async () => {
	const res = await fetch(`${baseUrl}/health`);
	assert.equal(res.status, 200);
	const json = await res.json();
	assert.equal(json.ok, true);
});

test('presets CRUD', async () => {
	// create
	const preset = { id: 'test-1', name: 'Test', params: { dotScale: 8 } };
	let res = await fetch(`${baseUrl}/presets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(preset) });
	assert.equal(res.status, 200);
	let j = await res.json();
	assert.equal(j.id, 'test-1');
	// list
	res = await fetch(`${baseUrl}/presets`);
	j = await res.json();
	assert.ok(Array.isArray(j));
	assert.ok(j.find(p => p.id === 'test-1'));
	// update
	res = await fetch(`${baseUrl}/presets/test-1`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Test 2' }) });
	j = await res.json();
	assert.equal(j.name, 'Test 2');
	// delete
	res = await fetch(`${baseUrl}/presets/test-1`, { method: 'DELETE' });
	j = await res.json();
	assert.equal(j.ok, true);
});

test('policy audit mobile wide', async () => {
	const res = await fetch(`${baseUrl}/policy/audit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ width: 4000, height: 2000, device: 'mobile' }) });
	const j = await res.json();
	assert.equal(j.allowed, false);
	assert.ok(Array.isArray(j.violations) && j.violations.length > 0);
	assert.ok(j.fix && j.fix.width === 1920);
});
