import { Types, type Model } from 'mongoose';
import { createHash } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response, CookieOptions } from 'express';
import type { RefreshSession } from '../../schemas/RefreshSession.model';
import { AuthService, type AuthenticatedMember } from './auth.service';
import { MemberStatus } from '../../libs/enums/member.enum';

interface SessionFilter {
	tokenHash?: string;
	expiresAt?: { $gt: Date };
	$or?: { tokenHash: string }[];
}
interface SessionUpdate {
	$set: { tokenHash?: string; revokedAt?: Date; expiresAt?: Date };
	$push?: { usedTokenHashes: string };
}

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

describe('refresh sessions', () => {
	const id = new Types.ObjectId();
	const memberId = new Types.ObjectId();
	const token = `${id.toString()}.${'a'.repeat(64)}`;
	let sessions: {
		create: jest.Mock<Promise<unknown>, [Omit<RefreshSession, 'usedTokenHashes'>]>;
		findOne: jest.Mock<{ lean: jest.Mock<Promise<RefreshSession | null>, []> }, [SessionFilter]>;
		updateOne: jest.Mock<Promise<{ modifiedCount: number }>, [SessionFilter, SessionUpdate]>;
	};
	let members: {
		findOne: jest.Mock<{ lean: jest.Mock<Promise<Partial<AuthenticatedMember> | null>, []> }, [unknown]>;
	};
	let jwt: { signAsync: jest.Mock<Promise<string>, [unknown]> };
	let service: AuthService;
	let req: Request;
	let res: Response;
	let session: RefreshSession | null;
	let cookie: jest.Mock<void, [string, string, CookieOptions]>;
	let clearCookie: jest.Mock;
	let getHeader: jest.Mock<string | undefined, [string]>;

	beforeEach(() => {
		process.env.CLIENT_URLS = 'http://localhost:3000';
		session = {
			_id: id,
			memberId,
			tokenHash: hash(token),
			usedTokenHashes: [],
			expiresAt: new Date(Date.now() + 86_400_000),
		};
		sessions = {
			create: jest.fn<Promise<unknown>, [Omit<RefreshSession, 'usedTokenHashes'>]>().mockResolvedValue({}),
			findOne: jest.fn<ReturnType<typeof sessions.findOne>, [SessionFilter]>(() => ({
				lean: jest.fn<Promise<RefreshSession | null>, []>().mockResolvedValue(session),
			})),
			updateOne: jest
				.fn<Promise<{ modifiedCount: number }>, [SessionFilter, SessionUpdate]>()
				.mockResolvedValue({ modifiedCount: 1 }),
		};
		members = {
			findOne: jest.fn<ReturnType<typeof members.findOne>, [unknown]>(() => ({
				lean: jest
					.fn<Promise<Partial<AuthenticatedMember> | null>, []>()
					.mockResolvedValue({ _id: memberId, memberStatus: MemberStatus.ACTIVE }),
			})),
		};
		jwt = { signAsync: jest.fn<Promise<string>, [unknown]>().mockResolvedValue('access-token') };
		service = new AuthService(
			jwt as unknown as JwtService,
			sessions as unknown as Model<RefreshSession>,
			members as unknown as Model<AuthenticatedMember>,
		);
		cookie = jest.fn<void, [string, string, CookieOptions]>();
		clearCookie = jest.fn();
		getHeader = jest.fn<string | undefined, [string]>().mockReturnValue('http://localhost:3000');
		req = {
			get: getHeader,
			headers: { cookie: `pet_refresh=${token}` },
		} as unknown as Request;
		res = { cookie, clearCookie } as unknown as Response;
	});

	it('stores only a hash and creates an absolute 15-day session', async () => {
		const before = Date.now();
		await service.startSession(memberId, res);
		const record = sessions.create.mock.calls[0][0];
		const cookieCall = cookie.mock.calls[0];
		expect(record.tokenHash).toBe(hash(cookieCall[1]));
		expect(record.tokenHash).not.toBe(cookieCall[1]);
		expect(record.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 15 * 86_400_000);
		expect(record.expiresAt.getTime()).toBeLessThanOrEqual(Date.now() + 15 * 86_400_000);
		expect(cookieCall[2]).toMatchObject({
			httpOnly: true,
			sameSite: 'lax',
			path: '/graphql',
			expires: record.expiresAt,
		});
	});

	it('rotates atomically without extending the expiration', async () => {
		await expect(service.refresh(req, res)).resolves.toMatchObject({ accessToken: 'access-token' });
		const [filter, update] = sessions.updateOne.mock.calls[0];
		expect(filter.tokenHash).toBe(hash(token));
		expect(filter.expiresAt?.$gt).toBeInstanceOf(Date);
		expect(update.$push?.usedTokenHashes).toBe(hash(token));
		const cookieCall = cookie.mock.calls[0];
		expect(cookieCall[1]).not.toBe(token);
		expect(update.$set.tokenHash).toBe(hash(cookieCall[1]));
		expect(cookieCall[2].expires).toEqual(session!.expiresAt);
		expect(update.$set.expiresAt).toBeUndefined();
	});

	it('revokes the session when a previously consumed token is replayed', async () => {
		session!.tokenHash = 'new-hash';
		session!.usedTokenHashes = [hash(token)];
		await expect(service.refresh(req, res)).rejects.toThrow('reused');
		expect(sessions.updateOne).toHaveBeenCalledWith({ _id: id }, { $set: { revokedAt: expect.any(Date) as Date } });
		expect(clearCookie).toHaveBeenCalled();
		expect(jwt.signAsync).not.toHaveBeenCalled();
	});

	it('rejects expired or revoked sessions and clears the cookie', async () => {
		session = null;
		await expect(service.refresh(req, res)).rejects.toThrow('expired');
		expect(sessions.findOne.mock.calls[0][0]).toMatchObject({
			revokedAt: null,
			expiresAt: { $gt: expect.any(Date) as Date },
		});
		expect(clearCookie).toHaveBeenCalled();
	});

	it('revokes sessions for unavailable members', async () => {
		members.findOne.mockReturnValue({
			lean: jest.fn<Promise<Partial<AuthenticatedMember> | null>, []>().mockResolvedValue(null),
		});
		await expect(service.refresh(req, res)).rejects.toThrow('unavailable');
		expect(sessions.updateOne).toHaveBeenCalled();
		expect(cookie).not.toHaveBeenCalled();
	});

	it('does not issue cookies when another request already consumed the token', async () => {
		sessions.updateOne.mockResolvedValueOnce({ modifiedCount: 0 });
		await expect(service.refresh(req, res)).rejects.toThrow('consumed');
		expect(sessions.updateOne).toHaveBeenCalled();
		expect(cookie).not.toHaveBeenCalled();
	});

	it('rejects missing or untrusted origins before touching the session', async () => {
		for (const origin of [undefined, 'https://attacker.example']) {
			getHeader.mockReturnValue(origin);
			await expect(service.refresh(req, res)).rejects.toThrow('Origin');
			await expect(service.logout(req, res)).rejects.toThrow('Origin');
		}
		expect(sessions.findOne).not.toHaveBeenCalled();
		expect(sessions.updateOne).not.toHaveBeenCalled();
	});

	it('revokes on logout and clears the cookie, including when already logged out', async () => {
		await expect(service.logout(req, res)).resolves.toBe(true);
		expect(sessions.updateOne.mock.calls[0][0].$or).toEqual([
			{ tokenHash: hash(token) },
			{ usedTokenHashes: hash(token) },
		]);
		expect(clearCookie).toHaveBeenCalled();
		req.headers.cookie = undefined;
		await expect(service.logout(req, res)).resolves.toBe(true);
	});
});
