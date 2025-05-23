/* eslint-disable prettier/prettier */
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { Injectable } from "@nestjs/common";
import { Token } from "./interface/auth.interface";

@Injectable()
export class AuthService {
  private readonly SALT_LEN = 32;
  private readonly KEY_LEN = 64;

  private readonly SCRYPT_PARAMS = {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  };
  private readonly SCRYPT_PREFIX = "$scrypt$N=32768,r=8,p=1,maxmem=67108864$";

  private serializeHash(hash: Buffer, salt: Buffer) {
    const saltString = salt.toString("base64").split("=")[0];
    const hashString = hash.toString("base64").split("=")[0];
    return `${this.SCRYPT_PREFIX}${saltString}$${hashString}`;
  }

  private parseOptions(options: string) {
    const values = [];
    const items = options.split(",");
    for (const item of items) {
      const [key, val] = item.split("=");
      values.push([key, Number(val)]);
    }
    return Object.fromEntries(values);
  }

  private deserializeHash(phcString: string) {
    const [, name, options, salt64, hash64] = phcString.split("$");
    if (name !== "scrypt") {
      throw new Error("Node.js crypto module only supports scrypt");
    }
    const params = this.parseOptions(options);
    const salt = Buffer.from(salt64, "base64");
    const hash = Buffer.from(hash64, "base64");
    return { params, salt, hash };
  }

  //Băm mật khẩu
  hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
      randomBytes(this.SALT_LEN, (err, salt) => {
        if (err) {
          reject(err);
          return;
        }
        scrypt(
          password,
          salt,
          this.KEY_LEN,
          this.SCRYPT_PARAMS,
          (err, hash) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(this.serializeHash(hash, salt));
          }
        );
      });
    });
  }

  validatePassword(password: string, serHash: string): Promise<boolean> {
    const { params, salt, hash } = this.deserializeHash(serHash);
    return new Promise((resolve, reject) => {
      const callback = (err: Error, hashedPassword: Buffer) => {
        if (err) {
          reject(err);
          // return;
        }
        resolve(timingSafeEqual(hashedPassword, hash));
      };
      scrypt(password, salt, hash.length, params, callback);
    });
  }

  //Tạo JWT Token
  generateJWTRegisterAndLogin2FA(email: string): string {
    return sign({ email }, process.env.JWT_REGISTER_SECRET, {
      expiresIn: process.env.REGISTER_2FA_EXPIRED,
    });
  }

  generateJWTConfirm(email: string): string {
    return sign({ email }, process.env.CONFIRM_EXPIRED, {
      expiresIn: process.env.CONFIRM_EXPIRED,
    });
  }

  generateJWT(code: number, student_id: number): string {
    return sign({ code, student_id }, process.env.JWT_SECRET, {
      expiresIn: process.env.LOGIN_EXPIRED,
    });
  }
  //Giải mã JWT Token
  decodeJWT(ac_token: Token): JwtPayload | string {
    return verify(ac_token, process.env.JWT_SECRET);
  }
}
