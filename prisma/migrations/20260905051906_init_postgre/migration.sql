-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SCHEDULED', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('ADMIN', 'OPERATOR');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateTable
CREATE TABLE "boats" (
    "boat_id" INTEGER NOT NULL,
    "public_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "boat_type_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "boats_pkey" PRIMARY KEY ("boat_id")
);

-- CreateTable
CREATE TABLE "boat_types" (
    "boat_type_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "required_operation" "OperationType" NOT NULL,

    CONSTRAINT "boat_types_pkey" PRIMARY KEY ("boat_type_id")
);

-- CreateTable
CREATE TABLE "boat_departures" (
    "boat_departure_id" SERIAL NOT NULL,
    "exited_at" TIMESTAMP(3) NOT NULL,
    "boat_id" INTEGER NOT NULL,
    "estimated_return_datetime" TIMESTAMP(3) NOT NULL,
    "real_return_datetime" TIMESTAMP(3),
    "service_request_id" INTEGER NOT NULL,

    CONSTRAINT "boat_departures_pkey" PRIMARY KEY ("boat_departure_id")
);

-- CreateTable
CREATE TABLE "cradles" (
    "cradle_id" SERIAL NOT NULL,
    "state" TEXT NOT NULL,
    "cradle_code" TEXT NOT NULL,

    CONSTRAINT "cradles_pkey" PRIMARY KEY ("cradle_id")
);

-- CreateTable
CREATE TABLE "contracts" (
    "contract_id" SERIAL NOT NULL,
    "start_datetime" TIMESTAMP(3) NOT NULL,
    "boat_id" INTEGER NOT NULL,
    "end_datetime" TIMESTAMP(3),
    "cradle_id" INTEGER NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("contract_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "public_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_employee" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "employees" (
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "employee_number" TEXT NOT NULL,
    "employee_type" "EmployeeType" NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "members" (
    "user_id" INTEGER NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "business_name" TEXT,

    CONSTRAINT "members_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "password_reset_token_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("password_reset_token_id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "service_request_id" SERIAL NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'PENDING',
    "requested_datetime" TIMESTAMP(3) NOT NULL,
    "observations" TEXT,
    "internal_comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduled_date" TIMESTAMP(3),
    "scheduled_time" TEXT,
    "sector" TEXT,
    "service_type_id" INTEGER NOT NULL,
    "requested_by_user_id" INTEGER NOT NULL,
    "assigned_employee_id" INTEGER,
    "boat_id" INTEGER NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("service_request_id")
);

-- CreateTable
CREATE TABLE "service_types" (
    "service_type_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "service_types_pkey" PRIMARY KEY ("service_type_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "boats_public_id_key" ON "boats"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "boat_departures_service_request_id_key" ON "boat_departures"("service_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_public_id_key" ON "users"("public_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_document_type_document_number_key" ON "users"("document_type", "document_number");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_number_key" ON "employees"("employee_number");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "service_requests_assigned_employee_id_scheduled_date_idx" ON "service_requests"("assigned_employee_id", "scheduled_date");

-- AddForeignKey
ALTER TABLE "boats" ADD CONSTRAINT "boats_boat_type_id_fkey" FOREIGN KEY ("boat_type_id") REFERENCES "boat_types"("boat_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boats" ADD CONSTRAINT "boats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "members"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_departures" ADD CONSTRAINT "boat_departures_boat_id_fkey" FOREIGN KEY ("boat_id") REFERENCES "boats"("boat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "boat_departures" ADD CONSTRAINT "boat_departures_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_requests"("service_request_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_boat_id_fkey" FOREIGN KEY ("boat_id") REFERENCES "boats"("boat_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_cradle_id_fkey" FOREIGN KEY ("cradle_id") REFERENCES "cradles"("cradle_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "service_types"("service_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_requested_by_user_id_fkey" FOREIGN KEY ("requested_by_user_id") REFERENCES "members"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_assigned_employee_id_fkey" FOREIGN KEY ("assigned_employee_id") REFERENCES "employees"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_boat_id_fkey" FOREIGN KEY ("boat_id") REFERENCES "boats"("boat_id") ON DELETE RESTRICT ON UPDATE CASCADE;
