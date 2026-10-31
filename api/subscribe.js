/* Mailing list sign-up.
 *
 * This file exists for one reason: the MailerLite API key must never reach the
 * browser. Anything in the page source is public, so a key put there could be
 * read and used by anyone. The browser posts an address here, this runs on the
 * server, and the key is read from the environment and never sent back.
 *
 * Set these in the host's environment (Vercel: Project > Settings >
 * Environment Variables). Do not put them in a file in the repository.
 *
 *   MAILERLITE_API_KEY    required
 *   MAILERLITE_GROUP_ID   optional, the group new subscribers join
 *   MAILERLITE_STATUS     optional, defaults to "unconfirmed"
 *
 * The default status is "unconfirmed" on purpose. The page promises "one email
 * is on its way to confirm you wanted to join", and that promise is only kept
 * if the double opt-in confirmation is actually sent. Setting "active" here
 * would add people silently and make the page's own words untrue.
 */

const MAILERLITE_ENDPOINT = 'https://connect.mailerlite.com/api/subscribers';

/* Deliberately permissive. Real addresses defeat strict patterns, and the
   confirmation email is the thing that actually proves an address works. This
   only rejects what cannot be an address at all. */
function looksLikeEmail(value) {
  return typeof value === 'string' &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@.]+\.[^\s@]+$/.test(value);
}

function readBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'object') return body;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (err) {
      return Object.fromEntries(new URLSearchParams(body));
    }
  }
  return {};
}

/* Without JavaScript the browser does a normal form post and then renders
   whatever comes back, so that path needs a page rather than JSON. Every
   outcome gets one, not only success: a reader who mistypes an address, or who
   arrives while the list is unreachable, would otherwise be shown a bare
   sentence or a blob of JSON in an otherwise empty window. Same words and the
   same colours as the page they came from, so the two cannot drift apart. */
function page(title, heading, body) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${title} | Evolving Nexus</title>
<style>
  body { margin:0; min-height:100vh; display:grid; place-items:center;
         background:#070D10; color:#EDE3CC; text-align:center;
         font-family:Georgia,'Times New Roman',serif; line-height:1.7; padding:2rem; }
  .m { max-width:34rem }
  h1 { color:#E6BA75; font-size:1.6rem; margin:0 0 1rem; letter-spacing:.02em }
  a { color:#E6BA75 }
</style></head>
<body><div class="m">
  <p aria-hidden="true" style="color:#E6BA75;font-size:1.4rem;margin:0 0 .6rem">&#9670;</p>
  <h1>${heading}</h1>
  ${body}
  <p><a href="/">Back to Evolving Nexus</a></p>
</div></body></html>`;
}

function plainConfirmation() {
  return page('You are on the list', 'Welcome, you&rsquo;re on the list!',
    `<p>Check your inbox. One email is on its way to confirm you wanted to join.
       If it is not there in a few minutes, please look in your spam folder.</p>`);
}

function plainInvalid() {
  return page('Check that address', 'That address doesn&rsquo;t quite look right',
    `<p>Please go back and check it, then try again.</p>`);
}

function plainUnavailable() {
  return page('Sign-up unavailable', 'Something went wrong on our end',
    `<p>Your address was not added. Please try again in a few minutes.</p>`);
}

/* One place decides whether a caller gets JSON or a page, so a new branch
   cannot quietly answer a no-JavaScript visitor with JSON the way three of
   these used to. */
function reply(res, wantsJson, code, json, html) {
  if (wantsJson) return res.status(code).json(json);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(code).send(html);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = readBody(req);
  const wantsJson = String(req.headers['content-type'] || '').indexOf('json') !== -1;
  const email = typeof body.email === 'string' ? body.email.trim() : '';

  /* The honeypot is hidden from people and invisible to assistive technology,
     so anything in it came from a bot. Answer exactly as if it had worked:
     telling a bot it was caught only teaches it to avoid the trap next time.
     Checked here as well as in the browser, because a bot posting straight to
     this URL never runs the page's JavaScript. */
  if (body.company) {
    return reply(res, wantsJson, 200, { ok: true }, plainConfirmation());
  }

  if (!looksLikeEmail(email)) {
    return reply(res, wantsJson, 400,
      { error: 'Please enter a valid email address.' }, plainInvalid());
  }

  const key = process.env.MAILERLITE_API_KEY;
  if (!key) {
    /* Logged for the operator, generic for the visitor: an error message is
       not the place to describe how the server is configured. */
    console.error('MAILERLITE_API_KEY is not set; sign-up cannot be delivered');
    return reply(res, wantsJson, 500,
      { error: 'Sign-up is unavailable right now.' }, plainUnavailable());
  }

  const payload = { email: email, status: process.env.MAILERLITE_STATUS || 'unconfirmed' };
  if (process.env.MAILERLITE_GROUP_ID) payload.groups = [process.env.MAILERLITE_GROUP_ID];

  let upstream;
  try {
    upstream = await fetch(MAILERLITE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + key
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    console.error('MailerLite request failed', err);
    return reply(res, wantsJson, 502,
      { error: 'Sign-up is unavailable right now.' }, plainUnavailable());
  }

  /* 200 created, 201 created, 422 already a subscriber. The last one is a
     success from the reader's point of view: they asked to join and they are
     on the list. Telling them it failed would invite a second attempt that
     cannot succeed either. */
  if (upstream.ok || upstream.status === 422) {
    /* A 422 is reported to the reader as success, so log it. MailerLite also
       returns 422 for an address it considers malformed, and the validation
       here is deliberately permissive, so this is the one branch where the
       reader could be told it worked when nothing was added. Silent, it would
       be invisible; logged, it is a line in the function's output. */
    if (upstream.status === 422) {
      const why = await upstream.text().catch(function () { return ''; });
      console.warn('MailerLite returned 422, reported to the reader as success',
        why.slice(0, 500));
    }
    return reply(res, wantsJson, 200, { ok: true }, plainConfirmation());
  }

  const detail = await upstream.text().catch(function () { return ''; });
  console.error('MailerLite rejected the sign-up', upstream.status, detail.slice(0, 500));
  return reply(res, wantsJson, 502,
    { error: 'Sign-up is unavailable right now.' }, plainUnavailable());
};
