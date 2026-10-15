import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Message } from '../../../libs/enums/common.enum';
import type { AuthContext } from '../../../libs/types/auth';
import { AuthService } from '../auth.service';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private readonly reflector: Reflector,
		private readonly authService: AuthService,
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const roles = this.reflector.get<string[]>('roles', context.getHandler());
		if (!roles) return true;

		if (context.getType<string>() !== 'graphql') return true;

		const request = GqlExecutionContext.create(context).getContext<AuthContext>().req;
		const bearerToken = request.headers.authorization;
		if (!bearerToken) throw new BadRequestException(Message.TOKEN_NOT_EXIST);
		if (!bearerToken.startsWith('Bearer ')) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

		const token = bearerToken.split(' ')[1];
		const authMember = await this.authService.verifyToken(token);
		const hasPermission = roles.includes(authMember.memberType);

		if (!authMember || !hasPermission) throw new ForbiddenException(Message.ONLY_SPECIFIC_ROLES_ALLOWED);

		request.body ??= {};
		request.body.authMember = authMember;
		return true;
	}
}
