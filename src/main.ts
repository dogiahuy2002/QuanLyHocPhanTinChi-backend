import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ⚠️ Thêm dòng này để cho phép frontend gọi API
  app.enableCors({
    origin: "https://quan-ly-hoc-phan-tin-chi-frontend.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Origin",
      "https://quan-ly-hoc-phan-tin-chi-frontend.vercel.app"
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (req.method === "OPTIONS") {
      return res.sendStatus(204); // trả về ngay cho preflight OPTIONS
    }

    next();
  });

  const config = new DocumentBuilder()
    .setTitle("Quản lý học phần - Admin API")
    .setDescription("Tài liệu Swagger cho hệ thống Admin")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
