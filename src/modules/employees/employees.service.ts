import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { nanoid } from 'nanoid';

import { handlePrismaError } from '@/common/utils/handlePrismaError.util';
import { hashPassword } from '@/common/utils/hashPassword.util';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';

import {
  CreateEmployeeResponseDto,
  EmployeeResponseDto,
  UpdateEmployeeResponseDto,
} from './dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { UniqueFields } from './employees.types';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private prisma: PrismaService) {}
  async create(createEmployeeDto: CreateEmployeeDto) {
    const { email, documentType, documentNumber, licenseNumber } =
      createEmployeeDto;

    const uniqueFields: UniqueFields = {
      email,
      documentType,
      documentNumber,
      licenseNumber,
    };

    await this.assetIsUnique(uniqueFields);

    const hashedPassword = await hashPassword(createEmployeeDto.password);

    const result = await this.createUserAndEmployee({
      ...createEmployeeDto,
      password: hashedPassword,
    });

    this.logger.log(`Empleado creado: publicId=${result.publicId}`);

    return result;
  }

  async findOne(publicId: string): Promise<EmployeeResponseDto | null> {
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

    const response: EmployeeResponseDto = {
      publicId: employee.user.publicId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      phoneNumber: employee.user.phoneNumber,
      documentType: employee.user.documentType,
      documentNumber: employee.user.documentNumber,
      email: employee.user.email,
      employeeNumber: employee.employeeNumber,
      employeeType: employee.employeeType,
      licenseNumber: employee.licenseNumber,
      isEmployee: employee.user.isEmployee,
      isActive: employee.user.isActive,
    };

    return response;
  }

  async update(
    publicId: string,
    updateEmployeeDto: UpdateEmployeeDto,
  ): Promise<UpdateEmployeeResponseDto> {
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

        const response: UpdateEmployeeResponseDto = {
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

  async remove(publicId: string) {
    const user = await this.prisma.user.findUnique({
      where: { publicId },
      select: {
        userId: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      this.logger.warn(`Empleado no encontrado: publicId=${publicId}`);
      throw new NotFoundException(
        `No se encontro el empleado con id ${publicId}`,
      );
    }

    await this.prisma.user.update({
      where: { userId: user.userId },
      data: { isActive: false },
      select: {
        userId: true,
        isActive: true,
      },
    });

    this.logger.log(`Empleado removido: userId=${user.userId}`);

    return {
      success: true,
      message: `Empleado con id ${publicId} fue eliminado exitosamente`,
    };
  }

  private async assetIsUnique(props: UniqueFields) {
    const { email, documentType, documentNumber, licenseNumber } = props;

    const conflicts = await this.prisma.user.findMany({
      where: {
        OR: [
          { email },
          { documentType, documentNumber },
          {
            employee: {
              licenseNumber,
            },
          },
        ],
      },
      select: {
        email: true,
        documentType: true,
        documentNumber: true,
        employee: {
          select: {
            licenseNumber: true,
          },
        },
      },
    });

    const errors: string[] = [];

    for (const u of conflicts) {
      if (u.email === email) {
        errors.push('El email ya está registrado');
      }

      if (
        u.documentType === documentType &&
        u.documentNumber === documentNumber
      ) {
        errors.push('Ya existe un usuario con ese tipo y número de documento');
      }

      if (u.employee?.licenseNumber === licenseNumber) {
        errors.push('El número de licencia ya está registrado');
      }
    }

    if (errors.length > 0) {
      this.logger.warn(
        `Intento de creación duplicado:\n\r\t${errors.join('\n\r\t')}`,
      );
      throw new ConflictException(errors);
    }
  }

  private async createUserAndEmployee(
    newEmployee: CreateEmployeeDto,
  ): Promise<CreateEmployeeResponseDto> {
    const {
      firstName,
      lastName,
      documentType,
      documentNumber,
      email,
      employeeType,
      password,
      phoneNumber,
      licenseNumber,
    } = newEmployee;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            publicId: nanoid(10),
            documentType,
            documentNumber,
            email,
            password,
            phoneNumber,
            isEmployee: true,
          },
        });

        const employee = await tx.employee.create({
          data: {
            userId: user.userId,
            employeeType,
            employeeNumber: nanoid(10),
            licenseNumber,
            firstName,
            lastName,
          },
        });

        const response: CreateEmployeeResponseDto = {
          publicId: user.publicId,
          email: user.email,
          phoneNumber: user.phoneNumber,
          documentType: user.documentType,
          documentNumber: user.documentNumber,
          employeeType: employee.employeeType,
          employeeNumber: employee.employeeNumber,
          licenseNumber: employee.licenseNumber ?? null,
        };

        return response;
      });
    } catch (error) {
      handlePrismaError(
        error,
        this.logger,
        'Crear empleado',
        'Ya se encuentra registrado un empleado/socio con uno o varios datos ingresados',
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
}
