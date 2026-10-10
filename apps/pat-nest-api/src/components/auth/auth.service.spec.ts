import { Types } from 'mongoose';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { MemberStatus } from '../../libs/enums/member.enum';

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

describe('refresh sessions', () => {
  const id = new Types.ObjectId();
  const memberId = new Types.ObjectId();
  const token = `${id}.${'a'.repeat(64)}`;
  let sessions: any;
  let members: any;
  let jwt: any;
  let service: AuthService;
  let req: Request;
  let res: Response;
  let session: any;

  beforeEach(() => {
    process.env.CLIENT_URLS = 'http://localhost:3000';
    session = { _id: id, memberId, tokenHash: hash(token), usedTokenHashes: [], expiresAt: new Date(Date.now() + 86_400_000) };
    sessions = {
      create: jest.fn().mockResolvedValue({}),
      findOne: jest.fn(() => ({ lean: jest.fn().mockResolvedValue(session) })),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    members = { findOne: jest.fn(() => ({ lean: jest.fn().mockResolvedValue({ _id: memberId, memberStatus: MemberStatus.ACTIVE }) })) };
    jwt = { signAsync: jest.fn().mockResolvedValue('access-token') };
    service = new AuthService(jwt as JwtService, sessions, members);
    req = { get: jest.fn().mockReturnValue('http://localhost:3000'), headers: { cookie: `pet_refresh=${token}` } } as unknown as Request;
    res = { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response;
  });

  it('stores only a hash and creates an absolute 15-day session', async () => {
    const before = Date.now();
    await service.startSession(memberId, res);
    const record = sessions.create.mock.calls[0][0];
    const cookie = (res.cookie as jest.Mock).mock.calls[0];
    expect(record.tokenHash).toBe(hash(cookie[1]));
    expect(record.tokenHash).not.toBe(cookie[1]);
    expect(record.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 15 * 86_400_000);
    expect(record.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 15 * 86_400_000);
    expect(cookie[2]).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/graphql', expires: record.expiresAt });
  });

  it('rotates atomically without extending the expiration', async () => {
    await expect(service.refresh(req, res)).resolves.toMatchObject({ accessToken: 'access-token' });
    const [filter, update] = sessions.updateOne.mock.calls[0];
    expect(filter.tokenHash).toBe(hash(token));
    expect(filter.expiresAt.$gt).toBeInstanceOf(Date);
    expect(update.$push.usedTokenHashes).toBe(hash(token));
    const cookie = (res.cookie as jest.Mock).mock.calls[0];
    expect(cookie[1]).not.toBe(token);
    expect(update.$set.tokenHash).toBe(hash(cookie[1]));
    expect(cookie[2].expires).toEqual(session.expiresAt);
    expect(update.$set.expiresAt).toBeUndefined();
  });

  it('revokes the session when a previously consumed token is replayed', async () => {
    session.tokenHash = 'new-hash';
    session.usedTokenHashes = [hash(token)];
    await expect(service.refresh(req, res)).rejects.toThrow('reused');
    expect(sessions.updateOne).toHaveBeenCalledWith({ _id: id }, { $set: { revokedAt: expect.any(Date) } });
    expect(res.clearCookie).toHaveBeenCalled();
    expect(jwt.signAsync).not.toHaveBeenCalled();
  });

  it('rejects expired or revoked sessions and clears the cookie', async () => {
    session = null;
    await expect(service.refresh(req, res)).rejects.toThrow('expired');
    expect(sessions.findOne.mock.calls[0][0]).toMatchObject({ revokedAt: null, expiresAt: { $gt: expect.any(Date) } });
    expect(res.clearCookie).toHaveBeenCalled();
  });

  it('revokes sessions for unavailable members', async () => {
    members.findOne.mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
    await expect(service.refresh(req, res)).rejects.toThrow('unavailable');
    expect(sessions.updateOne).toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('does not issue cookies when another request already consumed the token', async () => {
    sessions.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
    await expect(service.refresh(req, res)).rejects.toThrow('consumed');
    expect(sessions.updateOne).toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it('rejects missing or untrusted origins before touching the session', async () => {
    for (const origin of [undefined, 'https://attacker.example']) {
      (req.get as jest.Mock).mockReturnValue(origin);
      await expect(service.refresh(req, res)).rejects.toThrow('Origin');
      await expect(service.logout(req, res)).rejects.toThrow('Origin');
    }
    expect(sessions.findOne).not.toHaveBeenCalled();
    expect(sessions.updateOne).not.toHaveBeenCalled();
  });

  it('revokes on logout and clears the cookie, including when already logged out', async () => {
    await expect(service.logout(req, res)).resolves.toBe(true);
    expect(sessions.updateOne.mock.calls[0][0].$or).toEqual([{ tokenHash: hash(token) }, { usedTokenHashes: hash(token) }]);
    expect(res.clearCookie).toHaveBeenCalled();
    req.headers.cookie = undefined;
    await expect(service.logout(req, res)).resolves.toBe(true);
  });
});
