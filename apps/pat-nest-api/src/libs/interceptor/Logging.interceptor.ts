import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const startedAt = Date.now();
    const label = this.getLabel(context);

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${label} completed in ${Date.now() - startedAt}ms`),
        error: (error: Error) =>
          this.logger.warn(`${label} failed in ${Date.now() - startedAt}ms: ${error.name}`),
      }),
    );
  }

  private getLabel(context: ExecutionContext): string {
    if (context.getType<string>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);
      return `GraphQL ${gqlContext.getInfo().parentType.name}.${gqlContext.getInfo().fieldName}`;
    }

    if (context.getType<string>() === 'http') {
      const request = context.switchToHttp().getRequest<{ method: string; url: string }>();
      return `HTTP ${request.method} ${request.url}`;
    }

    return context.getType<string>();
  }
}
