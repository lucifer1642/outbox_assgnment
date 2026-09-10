import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import expressApp, { initializeServices } from '../../../../backend/dist/index';

// DNS fix for Neon/Upstash in serverless
import dns from 'dns';
try { dns.setServers(['8.8.8.8', '1.1.1.1']); } catch (_) {}
try { dns.setDefaultResultOrder('ipv4first'); } catch (_) {}

let initialized = false;
let initPromise: Promise<void> | null = null;

async function ensureInitialized() {
  if (initialized) return;

  if (!initPromise) {
    initPromise = (async () => {
      if (typeof initializeServices === 'function') {
        await initializeServices();
      }
      initialized = true;
    })();
  }

  await initPromise;
}

// Simple Express-to-NextResponse adapter
async function expressToNext(
  app: any,
  request: NextRequest,
  path: string
): Promise<NextResponse> {
  const url = new URL(request.url);

  // Build a minimal IncomingMessage-like object
  const req = new Readable() as any;
  req._read = () => {};

  // Copy all headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  req.headers = headers;
  req.method = request.method;
  req.url = '/' + path + url.search;
  req.originalUrl = '/' + path + url.search;
  req.path = '/' + path;
  req.query = Object.fromEntries(url.searchParams.entries());
  req.connection = { encrypted: url.protocol === 'https:', remoteAddress: '127.0.0.1' };
  req.socket = { remoteAddress: request.headers.get('x-forwarded-for') || '127.0.0.1', encrypted: true };

  // Read body for non-GET/HEAD
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      const bodyBuffer = Buffer.from(await request.arrayBuffer());
      req.push(bodyBuffer);
    } catch {}
  }
  req.push(null);

  // Build a minimal ServerResponse-like object
  return new Promise<NextResponse>((resolve) => {
    const chunks: Buffer[] = [];
    const resHeaders: Record<string, string | string[]> = {};
    let statusCode = 200;
    let ended = false;

    const res = {
      statusCode: 200,
      headersSent: false,
      finished: false,

      setHeader(name: string, value: string | string[]) {
        resHeaders[name.toLowerCase()] = value;
        return this;
      },
      getHeader(name: string) {
        return resHeaders[name.toLowerCase()];
      },
      removeHeader(name: string) {
        delete resHeaders[name.toLowerCase()];
        return this;
      },
      hasHeader(name: string) {
        return name.toLowerCase() in resHeaders;
      },
      writeHead(code: number, reasonOrHeaders?: any, maybeHeaders?: any) {
        statusCode = code;
        this.statusCode = code;
        const h = typeof reasonOrHeaders === 'object' ? reasonOrHeaders : maybeHeaders;
        if (h) {
          for (const [k, v] of Object.entries(h)) {
            resHeaders[k.toLowerCase()] = v as string;
          }
        }
        return this;
      },
      write(chunk: any) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      },
      end(chunk?: any) {
        if (ended) return;
        ended = true;
        this.finished = true;
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));

        const body = Buffer.concat(chunks);
        const responseHeaders = new Headers();

        for (const [key, val] of Object.entries(resHeaders)) {
          if (Array.isArray(val)) {
            val.forEach((v) => responseHeaders.append(key, v));
          } else if (val !== undefined) {
            responseHeaders.set(key, String(val));
          }
        }

        // Handle redirects
        if (statusCode >= 300 && statusCode < 400 && resHeaders['location']) {
          const loc = Array.isArray(resHeaders['location'])
            ? resHeaders['location'][0]
            : resHeaders['location'];
          resolve(NextResponse.redirect(loc, statusCode as 301 | 302 | 303 | 307 | 308));
          return;
        }

        resolve(
          new NextResponse(body.length > 0 ? body : null, {
            status: statusCode,
            headers: responseHeaders,
          })
        );
      },

      // Express compatibility helpers
      status(code: number) {
        statusCode = code;
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        this.setHeader('content-type', 'application/json');
        this.end(JSON.stringify(data));
      },
      send(data: any) {
        if (typeof data === 'object' && !Buffer.isBuffer(data)) {
          this.json(data);
        } else {
          this.end(data);
        }
      },
      redirect(statusOrUrl: number | string, url?: string) {
        if (typeof statusOrUrl === 'string') {
          statusCode = 302;
          this.statusCode = 302;
          this.setHeader('location', statusOrUrl);
        } else {
          statusCode = statusOrUrl;
          this.statusCode = statusOrUrl;
          this.setHeader('location', url!);
        }
        this.end();
      },
      cookie(name: string, value: string, options: any = {}) {
        let c = `${name}=${encodeURIComponent(value)}`;
        if (options.maxAge) c += `; Max-Age=${Math.floor(options.maxAge / 1000)}`;
        if (options.domain) c += `; Domain=${options.domain}`;
        c += `; Path=${options.path || '/'}`;
        if (options.httpOnly) c += '; HttpOnly';
        if (options.secure) c += '; Secure';
        if (options.sameSite) c += `; SameSite=${options.sameSite}`;
        const existing = resHeaders['set-cookie'];
        if (existing) {
          if (Array.isArray(existing)) existing.push(c);
          else resHeaders['set-cookie'] = [existing, c];
        } else {
          resHeaders['set-cookie'] = c;
        }
        return this;
      },
      clearCookie(name: string, options: any = {}) {
        this.cookie(name, '', { ...options, maxAge: 0 });
        return this;
      },

      // Event emitter stubs
      on() { return this; },
      once() { return this; },
      emit() { return this; },
      addListener() { return this; },
      removeListener() { return this; },
      cork() {},
      uncork() {},
      flushHeaders() {},
    } as any;

    // Run Express
    app(req, res);
  });
}

async function handler(
  request: NextRequest,
  context: { params: Promise<{ path?: string[] }> }
) {
  const params = await context.params;
  const pathParts = params?.path || [];
  const fullPath = pathParts.join('/');

  try {
    await ensureInitialized();
    return await expressToNext(expressApp, request, fullPath);
  } catch (error: any) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;
