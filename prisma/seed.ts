import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
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

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function normalizeForEmail(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
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
    {
      name: 'Combustible',
      description: 'Carga de combustible con productos de alta calidad.',
    },
    {
      name: 'Limpieza',
      description:
        'Limpieza exterior e interior para que tu embarcación luzca siempre impecable.',
    },
    {
      name: 'Mantenimiento',
      description:
        'Mantenimiento preventivo y correctivo realizado por profesionales.',
    },
    {
      name: 'Botadura y retiro',
      description: 'Servicio de botadura y retiro de embarcaciones.',
    },
    {
      name: 'Carga de baterías',
      description: 'Carga y chequeo de baterías para un rendimiento óptimo.',
    },
    {
      name: 'Reparaciones',
      description: 'Reparaciones mecánicas y eléctricas en general.',
    },
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
    const createdAt = daysFromNow(-200 + i * 15);

    const user = await prisma.user.create({
      data: {
        publicId: nanoid(),
        email: `${normalizeForEmail(e.firstName)}.${normalizeForEmail(e.lastName)}@nautico.com.ar`,
        password: await hashPassword('Password123!'),
        phoneNumber: `341555${1000 + i}`,
        documentType: 'DNI',
        documentNumber: e.doc,
        isEmployee: true,
        createdAt,
        updatedAt: createdAt,
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

  const memberCreatedAtOffsets = [-150, -125, -100, -75, -50, -25, -10, -3];

  const members = [];
  for (const [i, m] of memberSeeds.entries()) {
    const createdAt = daysFromNow(memberCreatedAtOffsets[i]);
    const user = await prisma.user.create({
      data: {
        publicId: nanoid(),
        email: m.businessName
          ? 'contacto@nauticadellitoral.com.ar'
          : `${normalizeForEmail(m.firstName!)}.${normalizeForEmail(m.lastName!)}@gmail.com`,
        password: await hashPassword('Password123!'),
        phoneNumber: `341666${2000 + i}`,
        documentType: m.businessName ? 'CUIT' : 'DNI',
        documentNumber: m.doc,
        isEmployee: false,
        createdAt,
        updatedAt: createdAt,
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
  const boatDefs = [
    { name: 'Viento Sur', model: 'Sundancer 240', registration: 'SR240-001' },
    {
      name: 'Marea Alta',
      model: 'Activ 755 Sundeck',
      registration: 'QS755-002',
    },
    {
      name: 'Estrella del Paraná',
      model: 'Bavaria Cruiser 34',
      registration: 'BC34-003',
    },
    { name: 'Rayo Verde', model: 'Sea Fox 226', registration: 'SF226-004' },
    {
      name: 'Costa Brava',
      model: 'Beneteau Oceanis 38',
      registration: 'BO38-005',
    },
    { name: 'Aguas Claras', model: 'Perception Kayak', registration: 'PK-006' },
    { name: 'Luna Llena', model: 'Sundancer 320', registration: 'SR320-007' },
    { name: 'Horizonte Azul', model: 'Old Town Kayak', registration: 'OT-008' },
  ];

  const boatCreatedAtOffsets = [-180, -155, -130, -105, -80, -55, -30, -5];

  const boats = [];
  for (const [i, def] of boatDefs.entries()) {
    const owner = members[i % members.length];
    const boatType = boatTypesCycle[i % boatTypesCycle.length];
    const createdAt = daysFromNow(boatCreatedAtOffsets[i]);
    const boat = await prisma.boat.create({
      data: {
        publicId: nanoid(),
        name: def.name,
        model: def.model,
        registrationNumber: def.registration,
        description: `Embarcación tipo ${boatType.name.toLowerCase()} perteneciente a socio del club`,
        boatTypeId: boatType.boatTypeId,
        userId: owner.userId,
        createdAt,
        updatedAt: createdAt,
      },
    });
    boats.push(boat);
  }

  console.log('🧾 Creando solicitudes de servicio...');
  const serviceRequests = [];
  const sectores = ['Muelle Norte', 'Muelle Sur', 'Rampa Central'];

  for (let i = 0; i < 8; i++) {
    const boat = boats[i % boats.length];
    const member = members[i % members.length];
    const serviceType = serviceTypes[i % serviceTypes.length];

    // Ciclo de estados de ejemplo: pendiente, programada, completada, pendiente...
    const statusCycle = [
      ServiceStatus.PENDING,
      ServiceStatus.SCHEDULED,
      ServiceStatus.COMPLETED,
      ServiceStatus.PENDING,
    ];
    const status = statusCycle[i % statusCycle.length];
    const isPending = status === ServiceStatus.PENDING;
    const employee = employees[i % employees.length];

    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        status,
        requestedDatetime: daysFromNow(-10 + i),
        observations: `Solicitud de servicio para ${boat.name}`,
        serviceTypeId: serviceType.serviceTypeId,
        requestedByUserId: member.userId,
        boatId: boat.boatId,

        // Sin asignar hasta que se programe: null si sigue pendiente
        assignedEmployeeId: isPending ? null : employee.userId,
        scheduledDate: isPending ? null : daysFromNow(2 + i),
        scheduledTime: isPending ? null : '10:00',
        sector: isPending ? null : sectores[i % sectores.length],
      },
    });
    serviceRequests.push(serviceRequest);
  }

  console.log('🌊 Creando salidas de embarcaciones...');
  // Solo tiene sentido una salida para solicitudes ya programadas/en curso/completadas
  const scheduledOrLaterRequests = serviceRequests.filter(
    (sr) => sr.status !== ServiceStatus.PENDING,
  );

  for (const [i, serviceRequest] of scheduledOrLaterRequests.entries()) {
    const boat = boats.find((b) => b.boatId === serviceRequest.boatId)!;
    const exitedAt = daysFromNow(-10 + i);
    await prisma.boatDeparture.create({
      data: {
        exitedAt,
        boatId: boat.boatId,
        estimatedReturnDatetime: new Date(
          exitedAt.getTime() + 4 * 60 * 60 * 1000,
        ),
        realReturnDatetime:
          serviceRequest.status === ServiceStatus.COMPLETED
            ? new Date(exitedAt.getTime() + 3.5 * 60 * 60 * 1000)
            : null,
        serviceRequestId: serviceRequest.serviceRequestId,
      },
    });
  }

  console.log('📄 Creando contratos de guarda (cuna)...');
  // Ahora TODAS las embarcaciones tienen contrato: no puede existir un
  // bote sin contrato en la guardería (regla de negocio).
  for (const [i, boat] of boats.entries()) {
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
