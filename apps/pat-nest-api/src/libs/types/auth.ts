import type { AuthenticatedMember } from '../../components/auth/auth.service';

// Guardlar tekshirgan foydalanuvchi shu so'rov orqali resolverga uzatiladi.
export interface AuthRequest {
	headers: { authorization?: string };
	body?: { authMember?: AuthenticatedMember | null };
}

export interface AuthContext {
	req: AuthRequest;
}
