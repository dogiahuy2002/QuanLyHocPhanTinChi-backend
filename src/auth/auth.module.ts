import { Module, forwardRef } from "@nestjs/common";
import { CommonModule } from "../common/common.module";
import { PrismaModule } from "../prisma/prisma.module";
import { UserModule } from "../user/user.module";
import { AuthService } from "./auth.service";
import { JwtModule } from "@nestjs/jwt";
import { AuthGuard } from "./guard/auth.guard";

@Module({
  imports: [
    forwardRef(() => UserModule),
    PrismaModule,
    CommonModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "default_secret", // đổi secret thật trong .env
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [AuthService, AuthGuard],
  exports: [AuthService, AuthGuard, JwtModule],
})
export class AuthModule {}
