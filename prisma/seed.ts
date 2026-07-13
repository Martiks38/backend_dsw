import { nanoid } from 'nanoid';
import 'dotenv/config';
import {
  PrismaClient,
  CradleSizeCategory,
  StatusEnrollment,
  InstallmentStatus,
  InstallmentType,
} from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { hashPassword } from '../src/common/utils/hashPassword.util';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida en .env');
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('🧹 Limpiando datos existentes...');
  // Orden inverso a las dependencias por las FKs.
  await prisma.installment.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.coursePrice.deleteMany();
  await prisma.courseSchedule.deleteMany();
  await prisma.course.deleteMany();
  await prisma.employeesActivities.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.boatDeparture.deleteMany();
  await prisma.boat.deleteMany();
  await prisma.member.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cradleTariff.deleteMany();
  await prisma.cradle.deleteMany();
  await prisma.cradleCategory.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.boatType.deleteMany();

  console.log('⛵ Creando tipos de embarcación...');
  const [velaType, motorType, kayakType] = await Promise.all([
    prisma.boatType.create({
      data: {
        name: 'Vela',
        requiredOperation: 'Timón manual y conocimiento de maniobras a vela',
      },
    }),
    prisma.boatType.create({
      data: {
        name: 'Motor',
        requiredOperation: 'Licencia habilitante de motorista',
      },
    }),
    prisma.boatType.create({
      data: { name: 'Kayak', requiredOperation: 'Ninguno' },
    }),
  ]);

  console.log('🛟 Creando categorías de cuna...');
  const [chica, mediana, grande] = await Promise.all([
    prisma.cradleCategory.create({
      data: { name: 'Chica', hierarchyLevel: 1 },
    }),
    prisma.cradleCategory.create({
      data: { name: 'Mediana', hierarchyLevel: 2 },
    }),
    prisma.cradleCategory.create({
      data: { name: 'Grande', hierarchyLevel: 3 },
    }),
  ]);

  console.log('🪑 Creando cunas...');
  const cradleDefs = [
    {
      cradleId: 1,
      cradleCode: 'C-001',
      sizeCategory: CradleSizeCategory.SMALL,
      category: chica,
    },
    {
      cradleId: 2,
      cradleCode: 'C-002',
      sizeCategory: CradleSizeCategory.SMALL,
      category: chica,
    },
    {
      cradleId: 3,
      cradleCode: 'C-003',
      sizeCategory: CradleSizeCategory.MEDIUM,
      category: mediana,
    },
    {
      cradleId: 4,
      cradleCode: 'C-004',
      sizeCategory: CradleSizeCategory.MEDIUM,
      category: mediana,
    },
    {
      cradleId: 5,
      cradleCode: 'C-005',
      sizeCategory: CradleSizeCategory.LARGE,
      category: grande,
    },
    {
      cradleId: 6,
      cradleCode: 'C-006',
      sizeCategory: CradleSizeCategory.LARGE,
      category: grande,
    },
  ];

  const cradles = [];
  for (const [i, def] of cradleDefs.entries()) {
    const cradle = await prisma.cradle.create({
      data: {
        cradleId: def.cradleId,
        state: i % 2 === 0 ? 'Disponible' : 'Ocupada',
        cradleCode: def.cradleCode,
        sizeCategory: def.sizeCategory,
        isOccupied: i % 2 !== 0,
        cradleCategoryId: def.category.cradleCategoryId,
      },
    });
    cradles.push(cradle);
  }

  console.log('💲 Creando tarifas de cuna...');
  await Promise.all(
    [chica, mediana, grande].map((cat, idx) =>
      prisma.cradleTariff.create({
        data: {
          cradleCategoryId: cat.cradleCategoryId,
          startDate: daysFromNow(-90),
          monthlyPrice: 15000 * (idx + 1),
        },
      }),
    ),
  );

  console.log('🏄 Creando actividades...');
  const [velaLiviana, motonautica, kayakRecreativo, navegacionAvanzada] =
    await Promise.all([
      prisma.activity.create({
        data: {
          publicId: nanoid(),
          name: 'Vela liviana',
          description:
            'Iniciación a la navegación a vela en embarcaciones livianas',
          boatTypeId: velaType.boatTypeId,
        },
      }),
      prisma.activity.create({
        data: {
          publicId: nanoid(),
          name: 'Motonáutica básica',
          description: 'Curso introductorio de manejo de embarcaciones a motor',
          boatTypeId: motorType.boatTypeId,
        },
      }),
      prisma.activity.create({
        data: {
          publicId: nanoid(),
          name: 'Kayak recreativo',
          description: 'Salidas guiadas de kayak para todo público',
          boatTypeId: kayakType.boatTypeId,
        },
      }),
      prisma.activity.create({
        data: {
          publicId: nanoid(),
          name: 'Navegación avanzada',
          description: 'Perfeccionamiento de maniobras y regatas',
          boatTypeId: velaType.boatTypeId,
        },
      }),
    ]);

  console.log('👷 Creando usuarios empleados...');
  const employeeSeeds = [
    {
      firstName: 'Marcos',
      lastName: 'Ibáñez',
      doc: '30111222',
      employeeNumber: 'EMP-001',
      employeeType: 'Instructor',
      licenseNumber: 'LIC-9001',
    },
    {
      firstName: 'Lucía',
      lastName: 'Fernández',
      doc: '30222333',
      employeeNumber: 'EMP-002',
      employeeType: 'Instructor',
      licenseNumber: 'LIC-9002',
    },
    {
      firstName: 'Gastón',
      lastName: 'Romero',
      doc: '30333444',
      employeeNumber: 'EMP-003',
      employeeType: 'Instructor',
      licenseNumber: null,
    },
    {
      firstName: 'Valentina',
      lastName: 'Suárez',
      doc: '30444555',
      employeeNumber: 'EMP-004',
      employeeType: 'Administrativo',
      licenseNumber: null,
    },
    {
      firstName: 'Diego',
      lastName: 'Acosta',
      doc: '30555666',
      employeeNumber: 'EMP-005',
      employeeType: 'Instructor',
      licenseNumber: 'LIC-9005',
    },
  ];

  const employees = [];
  for (const [i, e] of employeeSeeds.entries()) {
    const user = await prisma.user.create({
      data: {
        publicId: nanoid(),
        email: `${e.firstName.toLowerCase()}.${e.lastName.toLowerCase()}@nautico.com.ar`,
        password: await hashPassword('Password123!'),
        phoneNumber: `341555${1000 + i}`,
        documentType: 'DNI',
        documentNumber: e.doc,
        isEmployee: true,
        employee: {
          create: {
            firstName: e.firstName,
            lastName: e.lastName,
            employeeNumber: e.employeeNumber,
            employeeType: e.employeeType,
            licenseNumber: e.licenseNumber,
          },
        },
      },
      include: { employee: true },
    });
    employees.push(user);
  }

  console.log('🧍 Creando usuarios socios (members)...');
  const memberSeeds = [
    { firstName: 'Julián', lastName: 'Pereyra', doc: '32111222' },
    { firstName: 'Camila', lastName: 'Gómez', doc: '32222333' },
    { firstName: 'Nicolás', lastName: 'Álvarez', doc: '32333444' },
    { firstName: 'Sofía', lastName: 'Martínez', doc: '32444555' },
    { firstName: 'Tomás', lastName: 'Ledesma', doc: '32555666' },
    { firstName: 'Agustina', lastName: 'Ríos', doc: '32666777' },
    {
      firstName: null,
      lastName: null,
      businessName: 'Náutica del Litoral S.A.',
      doc: '30999888',
    },
    { firstName: 'Federico', lastName: 'Correa', doc: '32777888' },
  ];

  const members = [];
  for (const [i, m] of memberSeeds.entries()) {
    const user = await prisma.user.create({
      data: {
        publicId: nanoid(),
        email: m.businessName
          ? 'contacto@nauticadellitoral.com.ar'
          : `${m.firstName!.toLowerCase()}.${m.lastName!.toLowerCase()}@gmail.com`,
        password: await hashPassword('Password123!'),
        phoneNumber: `341666${2000 + i}`,
        documentType: m.businessName ? 'CUIT' : 'DNI',
        documentNumber: m.doc,
        isEmployee: false,
        member: {
          create: {
            firstName: m.firstName ?? undefined,
            lastName: m.lastName ?? undefined,
            businessName: m.businessName ?? undefined,
          },
        },
      },
      include: { member: true },
    });
    members.push(user);
  }

  console.log('🚤 Creando embarcaciones...');
  const boatTypesCycle = [velaType, motorType, kayakType];
  const boatNames = [
    'Viento Sur',
    'Marea Alta',
    'Estrella del Paraná',
    'Rayo Verde',
    'Costa Brava',
    'Aguas Claras',
    'Luna Llena',
    'Horizonte Azul',
  ];

  const boats = [];
  for (const [i, name] of boatNames.entries()) {
    const owner = members[i % members.length];
    const boatType = boatTypesCycle[i % boatTypesCycle.length];
    const boat = await prisma.boat.create({
      data: {
        hin: 1000 + i,
        publicId: nanoid(),
        name,
        description: `Embarcación tipo ${boatType.name.toLowerCase()} perteneciente a socio del club`,
        boatTypeId: boatType.boatTypeId,
        userId: owner.userId,
      },
    });
    boats.push(boat);
  }

  console.log('🌊 Creando salidas de embarcaciones...');
  for (let i = 0; i < 5; i++) {
    const boat = boats[i];
    const exitedAt = daysFromNow(-10 + i);
    await prisma.boatDeparture.create({
      data: {
        exitedAt,
        boatId: boat.hin,
        publicId: nanoid(),
        estimatedReturnDatetime: new Date(
          exitedAt.getTime() + 4 * 60 * 60 * 1000,
        ),
        realReturnDatetime:
          i % 2 === 0
            ? new Date(exitedAt.getTime() + 3.5 * 60 * 60 * 1000)
            : null,
      },
    });
  }

  console.log('📄 Creando contratos de guarda (cuna)...');
  const contracts = [];
  for (let i = 0; i < 6; i++) {
    const boat = boats[i];
    const cradle = cradles[i % cradles.length];
    const startDatetime = daysFromNow(-60 + i * 5);
    const contract = await prisma.contract.create({
      data: {
        startDatetime,
        boatId: boat.hin,
        endDatetime: i % 3 === 0 ? daysFromNow(120) : null,
        cradleId: cradle.cradleId,
      },
    });
    contracts.push(contract);
  }

  console.log('🧑‍🏫 Vinculando empleados con actividades...');
  const activitiesCycle = [
    velaLiviana,
    motonautica,
    kayakRecreativo,
    navegacionAvanzada,
  ];
  const employeesActivities = [];
  for (let i = 0; i < 4; i++) {
    const employee = employees[i];
    const activity = activitiesCycle[i];
    const ea = await prisma.employeesActivities.create({
      data: {
        employeeId: employee.userId,
        activityId: activity.activityId,
      },
    });
    employeesActivities.push({ ...ea, activity, employee });
  }

  console.log('📚 Creando cursos...');
  const courseDefs = [
    { name: 'Vela liviana - Nivel inicial', capacity: 12 },
    { name: 'Motonáutica - Habilitación básica', capacity: 8 },
    { name: 'Kayak - Salida recreativa', capacity: 15 },
    { name: 'Regatas - Perfeccionamiento', capacity: 10 },
  ];

  const courses = [];
  for (const [i, def] of courseDefs.entries()) {
    const ea = employeesActivities[i];
    const start_date = daysFromNow(7 + i * 7);
    const end_date = daysFromNow(7 + i * 7 + 60);
    const course = await prisma.course.create({
      data: {
        publicId: nanoid(),
        capacity: def.capacity,
        start_date,
        end_date,
        name: def.name,
        activityId: ea.activityId,
        employeeId: ea.employeeId,
      },
    });
    courses.push(course);
  }

  console.log('🗓️ Creando horarios de cursos...');
  const weekdaysByCourse = [
    ['LUNES', 'MIERCOLES'],
    ['MARTES'],
    ['SABADO'],
    ['JUEVES', 'VIERNES'],
  ];
  for (const [i, course] of courses.entries()) {
    for (const weekday of weekdaysByCourse[i]) {
      const startTime = new Date('1970-01-01T09:00:00Z');
      const endTime = new Date('1970-01-01T11:00:00Z');
      await prisma.courseSchedule.create({
        data: { weekday, startTime, endTime, courseId: course.courseId },
      });
    }
  }

  console.log('💵 Creando precios de cursos...');
  for (const [i, course] of courses.entries()) {
    await prisma.coursePrice.create({
      data: {
        startDate: daysFromNow(-15),
        enrollmentPrice: 8000 + i * 1000,
        installmentPrice: 5000 + i * 500,
        courseId: course.courseId,
      },
    });
  }

  console.log('📝 Creando inscripciones (enrollments)...');
  const enrollments = [];
  for (let i = 0; i < 10; i++) {
    const member = members[i % members.length];
    const course = courses[i % courses.length];
    try {
      const enrollment = await prisma.enrollment.create({
        data: {
          memberId: member.userId,
          courseId: course.courseId,
          registered_at: daysFromNow(-5 + i),
          status:
            i % 5 === 0 ? StatusEnrollment.DROPPED : StatusEnrollment.ACTIVE,
        },
      });
      enrollments.push(enrollment);
    } catch {
      // Evita duplicados si el mismo socio ya está inscripto en ese curso (PK compuesta)
    }
  }

  console.log('💳 Creando cuotas (installments)...');
  // El modelo Installment referencia simultáneamente a un Enrollment (userId+courseId)
  // y a un Contract (startDatetime+boatId), por lo que toda cuota necesita ambos
  // vínculos completos independientemente de su installmentType.
  for (let i = 0; i < 10; i++) {
    const enrollment = enrollments[i % enrollments.length];
    const contract = contracts[i % contracts.length];
    const isEnrollmentInstallment = i % 2 === 0;
    await prisma.installment.create({
      data: {
        publicId: nanoid(),
        paymentDate: daysFromNow(30 - i * 3),
        installmentStatus:
          i % 3 === 0
            ? InstallmentStatus.PAID
            : i % 3 === 1
              ? InstallmentStatus.PENDING
              : InstallmentStatus.OVERDUE,
        installmentType: isEnrollmentInstallment
          ? InstallmentType.ENROLLMENT
          : InstallmentType.CRADLE_RENTAL,
        amount: isEnrollmentInstallment ? 5000 : 15000,
        userId: enrollment.memberId,
        courseId: enrollment.courseId,
        startDatetime: contract.startDatetime,
        boatId: contract.boatId,
      },
    });
  }

  console.log('✅ Seed completado con éxito.');
}

main()
  .catch((err) => {
    console.error('❌ Error ejecutando el seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
