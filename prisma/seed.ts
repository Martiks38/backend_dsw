import 'dotenv/config';

import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { nanoid } from 'nanoid';

import { hashPassword } from '../src/common/utils/hashPassword.util';
import {
  EmployeeType,
  OperationType,
  PrismaClient,
  ServiceStatus,
} from '../src/generated/prisma/client';

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

  await prisma.passwordResetToken.deleteMany();
  await prisma.boatDeparture.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.boat.deleteMany();
  await prisma.member.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.cradle.deleteMany();
  await prisma.boatType.deleteMany();
  await prisma.serviceType.deleteMany();

  console.log('⛵ Creando tipos de embarcación...');
  const [velaType, motorType, kayakType] = await Promise.all([
    prisma.boatType.create({
      data: { name: 'Vela', requiredOperation: OperationType.MANUAL },
    }),
    prisma.boatType.create({
      data: { name: 'Motor', requiredOperation: OperationType.AUTOMATIC },
    }),
    prisma.boatType.create({
      data: { name: 'Kayak', requiredOperation: OperationType.MANUAL },
    }),
  ]);

  console.log('🪑 Creando cunas...');
  const cradleDefs = [
    { cradleCode: 'C-001', state: 'Disponible' },
    { cradleCode: 'C-002', state: 'Ocupada' },
    { cradleCode: 'C-003', state: 'Disponible' },
    { cradleCode: 'C-004', state: 'Ocupada' },
    { cradleCode: 'C-005', state: 'Disponible' },
    { cradleCode: 'C-006', state: 'Ocupada' },
  ];

  const cradles = [];
  for (const def of cradleDefs) {
    const cradle = await prisma.cradle.create({
      data: { state: def.state, cradleCode: def.cradleCode },
    });
    cradles.push(cradle);
  }

  console.log('🛠️ Creando tipos de servicio...');
  const serviceTypeDefs = [
    { name: 'Botadura', description: 'Ingreso de la embarcación al agua' },
    {
      name: 'Guardado en cuna',
      description: 'Retiro del agua y almacenamiento en cuna',
    },
    {
      name: 'Mantenimiento de casco',
      description: 'Limpieza y mantenimiento del casco',
    },
    { name: 'Revisión de motor', description: 'Chequeo y service del motor' },
  ];
  const serviceTypes = [];
  for (const def of serviceTypeDefs) {
    const serviceType = await prisma.serviceType.create({
      data: { name: def.name, description: def.description },
    });
    serviceTypes.push(serviceType);
  }

  console.log('👷 Creando usuarios empleados...');
  const employeeSeeds = [
    {
      firstName: 'Marcos',
      lastName: 'Ibáñez',
      doc: '30111222',
      employeeNumber: 'EMP-001',
      employeeType: EmployeeType.OPERATOR,
    },
    {
      firstName: 'Lucía',
      lastName: 'Fernández',
      doc: '30222333',
      employeeNumber: 'EMP-002',
      employeeType: EmployeeType.OPERATOR,
    },
    {
      firstName: 'Gastón',
      lastName: 'Romero',
      doc: '30333444',
      employeeNumber: 'EMP-003',
      employeeType: EmployeeType.OPERATOR,
    },
    {
      firstName: 'Valentina',
      lastName: 'Suárez',
      doc: '30444555',
      employeeNumber: 'EMP-004',
      employeeType: EmployeeType.ADMIN,
    },
    {
      firstName: 'Diego',
      lastName: 'Acosta',
      doc: '30555666',
      employeeNumber: 'EMP-005',
      employeeType: EmployeeType.OPERATOR,
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
        boatId: i + 1,
        publicId: nanoid(),
        name,
        description: `Embarcación tipo ${boatType.name.toLowerCase()} perteneciente a socio del club`,
        boatTypeId: boatType.boatTypeId,
        userId: owner.userId,
      },
    });
    boats.push(boat);
  }

  console.log('🧾 Creando solicitudes de servicio...');
  const serviceRequests = [];
  for (let i = 0; i < 5; i++) {
    const boat = boats[i];
    const member = members[i % members.length];
    const employee = employees[i % employees.length];
    const serviceType = serviceTypes[i % serviceTypes.length];
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        status: i % 4 === 0 ? ServiceStatus.COMPLETED : ServiceStatus.PENDING,
        requestedDatetime: daysFromNow(-10 + i),
        observations: `Solicitud de servicio para ${boat.name}`,
        serviceTypeId: serviceType.serviceTypeId,
        requestedByUserId: member.userId,
        assignedEmployeeId: employee.userId,
        boatId: boat.boatId,
      },
    });
    serviceRequests.push(serviceRequest);
  }

  console.log('🌊 Creando salidas de embarcaciones...');
  for (let i = 0; i < 5; i++) {
    const boat = boats[i];
    const serviceRequest = serviceRequests[i];
    const exitedAt = daysFromNow(-10 + i);
    await prisma.boatDeparture.create({
      data: {
        exitedAt,
        boatId: boat.boatId,
        estimatedReturnDatetime: new Date(
          exitedAt.getTime() + 4 * 60 * 60 * 1000,
        ),
        realReturnDatetime:
          i % 2 === 0
            ? new Date(exitedAt.getTime() + 3.5 * 60 * 60 * 1000)
            : null,
        serviceRequestId: serviceRequest.serviceRequestId,
      },
    });
  }

  console.log('📄 Creando contratos de guarda (cuna)...');
  for (let i = 0; i < 6; i++) {
    const boat = boats[i];
    const cradle = cradles[i % cradles.length];
    const startDatetime = daysFromNow(-60 + i * 5);
    await prisma.contract.create({
      data: {
        startDatetime,
        boatId: boat.boatId,
        endDatetime: i % 3 === 0 ? daysFromNow(120) : null,
        cradleId: cradle.cradleId,
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
