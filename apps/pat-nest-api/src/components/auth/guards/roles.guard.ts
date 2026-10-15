import { BadRequestException, CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthContext } from '../../../libs/types/auth';
import { AuthService } from '../auth.service';
import { Message } from '../../../libs/enums/common.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private authService: AuthService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.get<string[]>('roles', context.getHandler());
		if (!roles) return true;

		if (context.getType<string>() === 'graphql') {
			const request = GqlExecutionContext.create(context).getContext<AuthContext>().req;
			const bearerToken = request.headers.authorization;
			if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);
			if (!bearerToken.startsWith('Bearer ')) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

			const token = bearerToken.split(' ')[1],
				authMember = await this.authService.verifyToken(token),
				hasPermission = roles.includes(authMember.memberType);

			if (!authMember || !hasPermission) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

			request.body ??= {};
			request.body.authMember = authMember;
			return true;
		}
		return true;
		// description => http, rpc, gprs and etc are ignored
	}
}
