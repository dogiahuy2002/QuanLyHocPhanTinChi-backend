/* eslint-disable prettier/prettier */
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ScheduleToDBDto } from "./dto/schedule.db.dto";
import { UpdateScheduleDto } from "./dto/update.schedule.dto";
@Injectable()
export class ScheduleRepository {
  constructor(private prisma: PrismaService) {}

  async createSchedule(data: ScheduleToDBDto) {
    return this.prisma.schedule.create({
      data: {
        class: {
          connect: {
            class_id: data.class_id,
          },
        },
        time: new Date(data.time.toString()),
        student: {
          connect: {
            student_id: data.student_id,
          },
        },
      },
    });
  }

  async getAllSchedule(student_id: number) {
    const data = await this.prisma.schedule.findMany({
      where: { student_id },
      include: {
        class: {
          include: {
            subject: true,
            enrollments: true,
          },
        },
      },
    });

    const final = await Promise.all(
      data.map(async (item) => {
        const enrollment = item.class.enrollments[0];
        const class_detail = enrollment
          ? await this.prisma.classDetail.findFirst({
              where: {
                class_id: item.class_id,
                class_detail_id: enrollment.class_detail_id,
              },
            })
          : null;

        return {
          ...item,
          class: {
            ...item.class,
            class_detail,
          },
        };
      })
    );

    return final;
  }

  async updateSchedule(id: number, data: UpdateScheduleDto) {
    return this.prisma.schedule.update({
      where: {
        schedule_id: id,
      },
      data: {
        time: new Date(data.time.toString()),
      },
    });
  }

  async deleteSchedule(id: number) {
    return this.prisma.schedule.delete({
      where: {
        schedule_id: id,
      },
    });
  }
}
