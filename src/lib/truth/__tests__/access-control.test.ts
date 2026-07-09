import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  verifyAgentAuthStrict, 
  verifyHumanBasicAuth, 
  isPublicStaticPath 
} from '../access-control';

describe('access-control (security lockdown)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  describe('Agent authentication (Bearer only, no fallback, no query)', () => {
    it('rejects missing MC_AUTH_TOKEN in production', () => {
      delete process.env.MC_AUTH_TOKEN;
      const req = new Request('http://example.com/api/agents/heartbeat', {
        headers: { authorization: 'Bearer anything' },
      });
      expect(verifyAgentAuthStrict(req)).toBe(false);
    });

    it('rejects old embedded fallback credential (no hardcoded fallback in code)', () => {
      delete process.env.MC_AUTH_TOKEN;
      const req = new Request('http://example.com/api/agents/heartbeat', {
        headers: { authorization: 'Bearer barry-update-2026' },
      });
      expect(verifyAgentAuthStrict(req)).toBe(false);
    });

    it('rejects query-string token', () => {
      process.env.MC_AUTH_TOKEN = 'correct-token-123';
      const req = new Request('http://example.com/api/agents/heartbeat?token=correct-token-123');
      expect(verifyAgentAuthStrict(req)).toBe(false);
    });

    it('rejects wrong bearer', () => {
      process.env.MC_AUTH_TOKEN = 'correct-token-123';
      const req = new Request('http://example.com/api/agents/heartbeat', {
        headers: { authorization: 'Bearer wrong-token' },
      });
      expect(verifyAgentAuthStrict(req)).toBe(false);
    });

    it('accepts correct explicit bearer on allowlisted route', () => {
      process.env.MC_AUTH_TOKEN = 'correct-token-123';
      const req = new Request('http://example.com/api/agents/heartbeat', {
        method: 'POST',
        headers: { authorization: 'Bearer correct-token-123' },
      });
      expect(verifyAgentAuthStrict(req)).toBe(true);
    });
  });

  describe('Human authentication (Basic Auth)', () => {
    it('returns 401 + WWW-Authenticate on missing Basic credentials', () => {
      process.env.MC_UI_USERNAME = 'justin';
      process.env.MC_UI_PASSWORD = 'secret';
      const req = new Request('http://example.com/tasks');
      const result = verifyHumanBasicAuth(req);
      expect(result).toBe(false);
    });

    it('rejects wrong Basic credentials', () => {
      process.env.MC_UI_USERNAME = 'justin';
      process.env.MC_UI_PASSWORD = 'secret';
      const req = new Request('http://example.com/tasks', {
        headers: { authorization: 'Basic ' + btoa('wrong:wrong') },
      });
      expect(verifyHumanBasicAuth(req)).toBe(false);
    });

    it('accepts correct Basic credentials', () => {
      process.env.MC_UI_USERNAME = 'justin';
      process.env.MC_UI_PASSWORD = 'secret';
      const req = new Request('http://example.com/tasks', {
        headers: { authorization: 'Basic ' + btoa('justin:secret') },
      });
      expect(verifyHumanBasicAuth(req)).toBe(true);
    });

    it('mutation endpoint cannot be reached with agent bearer alone (for human routes)', () => {
      process.env.MC_AUTH_TOKEN = 'agent-token';
      process.env.MC_UI_USERNAME = 'justin';
      process.env.MC_UI_PASSWORD = 'secret';
      const req = new Request('http://example.com/api/tasks', {
        method: 'POST',
        headers: { authorization: 'Bearer agent-token' },
      });
      expect(verifyHumanBasicAuth(req)).toBe(false);
    });
  });

  describe('Public static bypass', () => {
    it('bypasses auth for static assets', () => {
      expect(isPublicStaticPath('/_next/static/chunk.js')).toBe(true);
      expect(isPublicStaticPath('/favicon.ico')).toBe(true);
      expect(isPublicStaticPath('/health')).toBe(true);
    });

    it('requires auth for pages and APIs', () => {
      expect(isPublicStaticPath('/tasks')).toBe(false);
      expect(isPublicStaticPath('/api/tasks')).toBe(false);
      expect(isPublicStaticPath('/api/mission-control/actions')).toBe(false);
    });
  });
});
