import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { AuthenticatedMember } from '../auth.service';
import type { AuthContext, AuthRequest } from '../../../libs/types/auth';

export const AuthMember = createParamDecorator(
	(data: keyof AuthenticatedMember | undefined, context: ExecutionContext) => {
		const request =
			context.getType<string>() === 'graphql'
				? GqlExecutionContext.create(context).getContext<AuthContext>().req
				: context.switchToHttp().getRequest<AuthRequest>();

		const member = request.body?.authMember;

		if (member) return data ? member[data] : member;
		else return null;
	},
);
