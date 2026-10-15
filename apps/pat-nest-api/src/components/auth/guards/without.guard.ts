import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthContext } from '../../../libs/types/auth';
import { AuthService } from '../auth.service';

@Injectable()
export class WithoutGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (context.getType<string>() === 'graphql') {
			const request = GqlExecutionContext.create(context).getContext<AuthContext>().req,
				bearerToken = request.headers.authorization;
			request.body ??= {};

			if (bearerToken?.startsWith('Bearer ')) {
				try {
					const token = bearerToken.split(' ')[1],
						authMember = await this.authService.verifyToken(token);
					request.body.authMember = authMember;
				} catch {
					request.body.authMember = null;
				}
			} else request.body.authMember = null;

			return true;
		}
		return true;
		// description => http, rpc, gprs and etc are ignored
	}
}
