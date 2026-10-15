import { BadRequestException, CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Message } from '../../../libs/enums/common.enum';
import type { AuthContext } from '../../../libs/types/auth';
import { AuthService } from '../auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly authService: AuthService) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (context.getType<string>() !== 'graphql') return true;

		const request = GqlExecutionContext.create(context).getContext<AuthContext>().req;

		const bearerToken = request.headers.authorization;
		if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);
		if (!bearerToken.startsWith('Bearer ')) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

		const token = bearerToken.split(' ')[1];
		const authMember = await this.authService.verifyToken(token);
		if (!authMember) throw new UnauthorizedException(Message.NOT_AUTHENTICATED);

		request.body ??= {};
		request.body.authMember = authMember;

		return true;
	}
}
