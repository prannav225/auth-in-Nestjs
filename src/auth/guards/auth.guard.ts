import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { permission } from "process";
import { IS_PUBLIC_KEY } from "src/configs/public-key";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private jwtService: JwtService, private reflector: Reflector) {}

    async canActivate(context: ExecutionContext) {
        const isPublic = this.reflector.getAllAndOverride<boolean> (IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if(isPublic){
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const authorization = request.headers.authorization; //* 'Bearer <token>'
        const token = authorization?.split(' ')[1];
        if(!token) {
            throw new UnauthorizedException();
        }

        try {
           const tokenPayload = await this.jwtService.verifyAsync(token);
            request.user = {
                userId: tokenPayload.sub,
                Username: tokenPayload.username,
                role: tokenPayload.role,
                permission: tokenPayload.permission
            }
            return true;
        } catch (err) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}