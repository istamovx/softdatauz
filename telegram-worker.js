// Cloudflare Worker: SoftData sayti "Bizga yozing" vidjetidan kelgan xabarlarni Telegram botiga yuboradi.
// Bot tokeni bu faylda emas — worker'ning maxfiy o'zgaruvchilarida (secrets) saqlanadi, shuning uchun
// brauzerda yoki sayt kodida hech qachon ko'rinmaydi.
//
// Deploy qilish:
//   1. https://workers.cloudflare.com/ da bepul akkaunt oching (yoki mavjudidan foydalaning)
//   2. `npm install -g wrangler` va `wrangler login`
//   3. Shu faylni `worker.js` nomi bilan yangi wrangler loyihasiga qo'ying (`wrangler init` bilan boshlansa bo'ladi)
//   4. Maxfiy qiymatlarni o'rnating:
//        wrangler secret put TELEGRAM_BOT_TOKEN   (BotFather bergan token)
//        wrangler secret put TELEGRAM_CHAT_ID     (xabar boradigan chat/kanal ID'si)
//   5. `wrangler deploy` — sizga https://xxx.yyy.workers.dev manzili beriladi
//   6. Shu manzilni index.html ichidagi `telegramEndpoint` maydoniga yozing (masalan .../send)
//   7. ALLOWED_ORIGIN'ni pastda saytingiz domeniga almashtiring

const ALLOWED_ORIGIN = 'https://softdata.uz';

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return withCors(new Response(null, { status: 204 }));
    if (request.method !== 'POST') return withCors(new Response('Method not allowed', { status: 405 }));

    let body;
    try {
      body = await request.json();
    } catch (err) {
      return withCors(new Response('Invalid JSON', { status: 400 }));
    }

    const text = String(body.text || '').trim().slice(0, 2000);
    if (!text) return withCors(new Response('Empty message', { status: 400 }));

    const page = String(body.page || '').slice(0, 300);
    const lang = String(body.lang || '').slice(0, 10);
    const telegramText = `Yangi xabar (SoftData sayti)\n\n${text}\n\n— Sahifa: ${page}\n— Til: ${lang}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: telegramText })
    });

    if (!tgRes.ok) return withCors(new Response('Telegram error', { status: 502 }));
    return withCors(new Response('OK', { status: 200 }));
  }
};

function withCors(res) {
  const headers = new Headers(res.headers);
  headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(res.body, { status: res.status, headers });
}
