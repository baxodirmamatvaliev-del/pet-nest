import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthContext } from '../../../libs/types/auth';
import { AuthService } from '../auth.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (context.getType<string>() !== 'graphql') return true;

		const request = GqlExecutionContext.create(context).getContext<AuthContext>().req;
		const bearerToken = request.headers.authorization;
		request.body ??= {};

		if (bearerToken?.startsWith('Bearer ')) {
			try {
				const token = bearerToken.split(' ')[1];
				const authMember = await this.authService.verifyToken(token);
				request.body.authMember = authMember;
			} catch {
				request.body.authMember = null;
			}
		} else request.body.authMember = null;

		return true;
	}
}
