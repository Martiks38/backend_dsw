import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';

import { handlePrismaError } from '@/common/utils/handlePrismaError.util';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import { AccountProvisioningService } from '../common/account-provisioning.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: AccountProvisioningService,
  ) {}

  async create(dto: CreateEmployeeDto) {
    const fieldErrors: Record<string, string[]> = {};

    const emailTaken = await this.prisma.user.findFirst({
      where: { email: dto.email },
      select: { userId: true },
    });
    const documentTaken = await this.prisma.user.findFirst({
      where: { documentType: 'DNI', documentNumber: dto.documentNumber },
      select: { userId: true },
    });

    if (emailTaken)
      fieldErrors.email = ['El correo electrónico ya está registrado.'];
    if (documentTaken)
      fieldErrors.documentNumber = [
        'El número de documento ya está registrado.',
      ];

    if (Object.keys(fieldErrors).length > 0) {
      throw new ConflictException({
        message: 'Algunos datos ya están registrados.',
        fieldErrors,
      });
    }

    const tempPassword = this.provisioning.generateTempPassword();
    const passwordHash = await this.provisioning.hashTempPassword(tempPassword);

    try {
      const user = await this.prisma.user.create({
        data: {
          publicId: nanoid(),
          email: dto.email,
          password: passwordHash,
          phoneNumber: dto.phoneNumber,
          documentType: 'DNI',
          documentNumber: dto.documentNumber,
          isEmployee: true,
          employee: {
            create: {
              firstName: dto.firstName,
              lastName: dto.lastName,
              employeeNumber: nanoid(10),
              employeeType: dto.employeeType,
            },
          },
        },
      });

      await this.provisioning.sendInvitation(
        user.email,
        `${dto.firstName} ${dto.lastName}`,
        tempPassword,
      );

      return { success: true, publicId: user.publicId };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: 'Algunos datos ya están registrados.',
          fieldErrors: {
            general: ['Los datos ingresados ya están registrados.'],
          },
        });
      }
      throw error;
    }
  }

  async findOne(publicId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: {
        user: {
          publicId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      this.logger.warn(`Empleado no encontrado: publicId=${publicId}`);
      throw new NotFoundException(
        `No se encontró el empleado con id ${publicId}`,
      );
    }

    const response = {
      publicId: employee.user.publicId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.user.phoneNumber,
      documentType: employee.user.documentType,
      documentNumber: employee.user.documentNumber,
      email: employee.user.email,
      employeeNumber: employee.employeeNumber,
      employeeType: employee.employeeType,
      isEmployee: employee.user.isEmployee,
      isActive: employee.user.isActive,
    };

    return response;
  }

  async update(publicId: string, updateEmployeeDto: UpdateEmployeeDto) {
    const existingEmployee = await this.prisma.user.findUnique({
      where: { publicId },
      select: {
        userId: true,
        isActive: true,
      },
    });

    if (!existingEmployee || !existingEmployee.isActive) {
      throw new NotFoundException(
        `No se encontró el empleado con id ${publicId}`,
      );
    }

    const userData: Record<string, unknown> = {};
    const employeeData: Record<string, unknown> = {};

    const USER_FIELDS = new Set<string>(
      Object.values(Prisma.UserScalarFieldEnum),
    );
    const EMPLOYEE_FIELDS = new Set<string>(
      Object.values(Prisma.EmployeeScalarFieldEnum),
    );

    for (const key of Object.keys(updateEmployeeDto) as Array<
      keyof UpdateEmployeeDto
    >) {
      const value = updateEmployeeDto[key];
      if (value === undefined) continue;

      if (USER_FIELDS.has(key)) {
        userData[key] = value;
      } else if (EMPLOYEE_FIELDS.has(key)) {
        employeeData[key] = value;
      }
    }

    const { userId } = existingEmployee;
    await this.checkUniqueConstraints(userId, userData);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (Object.keys(userData).length > 0) {
          await tx.user.update({
            where: { userId },
            data: userData,
          });
        }

        if (Object.keys(employeeData).length > 0) {
          await tx.employee.update({
            where: { userId },
            data: employeeData,
          });
        }

        const updatedEmployee = await tx.employee.findUniqueOrThrow({
          where: { userId },
          select: {
            firstName: true,
            lastName: true,
            user: {
              select: {
                publicId: true,
                email: true,
                phoneNumber: true,
              },
            },
          },
        });

        const response = {
          publicId: updatedEmployee.user.publicId,
          email: updatedEmployee.user.email,
          phoneNumber: updatedEmployee.user.phoneNumber,
          firstName: updatedEmployee.firstName,
          lastName: updatedEmployee.lastName,
        };

        this.logger.log(`Empleado con id ${publicId} actualizado exitosamente`);

        return response;
      });
    } catch (error) {
      handlePrismaError(
        error,
        this.logger,
        'actualizar empleado',
        'Uno o varios campos ya se hallan registrados',
      );
    }
  }

  private async checkUniqueConstraints(
    userId: number,
    userData: UpdateEmployeeDto,
  ) {
    let error: string | null = null;
    let otherUser: { email: string } | null;

    if (typeof userData.email === 'string') {
      otherUser = await this.prisma.user.findFirst({
        where: {
          email: userData.email,
          userId: {
            not: userId,
          },
        },
        select: {
          email: true,
        },
      });

      if (otherUser) {
        error = 'El email ya está registrado';
      }
    }

    if (error) {
      throw new ConflictException(error);
    }
  }

  async getAllOperators() {
    const operators = await this.prisma.employee.findMany({
      where: { employeeType: 'OPERATOR' },
      include: { user: true },
      orderBy: { firstName: 'asc', lastName: 'asc' },
    });

    return operators.map((op) => {
      const { firstName, lastName, employeeNumber } = op;
      const { publicId, phoneNumber, documentType, documentNumber, email } =
        op.user;

      return {
        publicId,
        firstName,
        lastName,
        email,
        phoneNumber,
        documentType,
        documentNumber,
        employeeNumber,
      };
    });
  }

  async getAllPaginated() {
    const employees = await this.prisma.employee.findMany({
      include: { user: true },
      orderBy: { userId: 'asc' },
    });

    const assignedCounts = await this.prisma.serviceRequest.groupBy({
      by: ['assignedEmployeeId'],
      where: { assignedEmployeeId: { in: employees.map((e) => e.userId) } },
      _count: { assignedEmployeeId: true },
    });

    return employees.map((e) => ({
      publicId: e.user.publicId,
      name: `${e.firstName} ${e.lastName}`,
      role: e.employeeType === 'ADMIN' ? 'Admin' : 'Operador',
      phoneNumber: e.user.phoneNumber,
      isActive: e.user.isActive,
      assignedServices:
        assignedCounts.find((c) => c.assignedEmployeeId === e.userId)?._count
          .assignedEmployeeId ?? 0,
    }));
  }

  async setStatus(publicId: string, isActive: boolean, currentUserId: number) {
    const user = await this.prisma.user.findUnique({
      where: { publicId },
      include: { employee: true },
    });

    if (!user?.employee) throw new NotFoundException('Empleado no encontrado');

    if (user.userId === currentUserId && !isActive) {
      throw new BadRequestException('No podés desactivar tu propia cuenta');
    }

    await this.prisma.user.update({ where: { publicId }, data: { isActive } });

    return { success: true };
  }
}
