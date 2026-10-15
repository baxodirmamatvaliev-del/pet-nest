import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthContext } from '../../../libs/types/auth';
import { AuthService } from '../auth.service';
import { Message } from '../../../libs/enums/common.enum';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (context.getType<string>() === 'graphql') {
			const request = GqlExecutionContext.create(context).getContext<AuthContext>().req;

			const bearerToken = request.headers.authorization;
			if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);
			if (!bearerToken.startsWith('Bearer ')) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

			const token = bearerToken.split(' ')[1],
				authMember = await this.authService.verifyToken(token);
			if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

			request.body ??= {};
			request.body.authMember = authMember;

			return true;
		}
		return true;
		// description => http, rpc, gprs and etc are ignored
	}
}
