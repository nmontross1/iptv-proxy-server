import 'dotenv/config';
import express from 'express';
import { spawn } from 'child_process';
import fs from 'fs/promises';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { parse } = require('iptv-playlist-parser');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST_IP = process.env.HOST_IP || process.env.IP || '127.0.0.1';

let channels = [];

async function loadChannels() {
  const raw = await fs.readFile('m3u/channels.m3u', 'utf-8');
  const parsed = parse(raw);
  channels = parsed.items.map(item => ({
    name: item.name,
    url: item.url,
    meta: item,
  }));
}

await loadChannels();

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return Buffer.from(str, 'base64').toString('utf-8');
}

app.get('/proxy/:encodedUrl', (req, res) => {
  const encodedUrl = req.params.encodedUrl;
  const decodedUrl = base64UrlDecode(encodedUrl);
  const chan = channels.find(c => c.url.toLowerCase() === decodedUrl.toLowerCase());
  if (!chan) return res.status(404).send('Channel not found');

  res.setHeader('Content-Type', 'video/MP2T');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Connection', 'keep-alive');

  const streamlink = spawn('streamlink', [
    chan.url,
    'best',
    '--stdout',
    '--http-header', 'Origin=https://topembed.pw',
    '--http-header', 'Referer=https://topembed.pw/',
    '--http-header', 'User-Agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36',
  ]);

  streamlink.stdout.pipe(res);

  streamlink.stderr.on('data', data => {
    console.error(`[Streamlink][${chan.name}]`, data.toString());
  });

  streamlink.on('close', (code, signal) => {
    console.log(`[Streamlink][${chan.name}] closed with code ${code} signal ${signal}`);
    res.end();
  });

  req.on('close', () => {
    streamlink.kill();
  });
});

app.get('/playlist.m3u', (req, res) => {
  res.setHeader('Content-Type', 'application/x-mpegURL');
  const lines = ['#EXTM3U x-tvg-url="https://epgshare01.online/epgshare01/epg_ripper_US1.xml.gz"'];
  for (const chan of channels) {
    const encodedUrl = base64UrlEncode(chan.url);
    lines.push(
      `#EXTINF:-1 tvg-id="${chan.meta.tvg?.id || ''}" tvg-name="${chan.meta.name}" tvg-logo="${chan.meta.tvg?.logo || ''}" group-title="${chan.meta.group?.title || ''}",${chan.name}`,
      `http://${HOST_IP}:${PORT}/proxy/${encodedUrl}`
    );
  }
  res.send(lines.join('\r\n'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`▶ Proxy server running: http://${HOST_IP}:${PORT}/playlist.m3u`);
});
