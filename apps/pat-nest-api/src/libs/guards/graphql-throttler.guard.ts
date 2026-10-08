import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { GraphQLError } from 'graphql';

@Injectable()
export class GraphqlThrottlerGuard extends ThrottlerGuard {
	protected getRequestResponse(context: ExecutionContext): {
		req: Record<string, any>;
		res: Record<string, any>;
	} {
		if (context.getType<string>() !== 'graphql') {
			return super.getRequestResponse(context);
		}

		const graphqlContext = GqlExecutionContext.create(context).getContext<{
			req: Record<string, any>;
			res: Record<string, any>;
		}>();
		return { req: graphqlContext.req, res: graphqlContext.res };
	}

	protected async throwThrottlingException(
		context: ExecutionContext,
		throttlerLimitDetail: ThrottlerLimitDetail,
	): Promise<void> {
		if (context.getType<string>() === 'graphql') {
			throw new GraphQLError('Too many requests. Please try again later.', {
				extensions: { code: 'TOO_MANY_REQUESTS', status: 429 },
			});
		}

		await super.throwThrottlingException(context, throttlerLimitDetail);
	}
}
