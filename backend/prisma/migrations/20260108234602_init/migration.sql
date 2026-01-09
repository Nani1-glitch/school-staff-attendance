-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phoneOrEmail" TEXT NOT NULL,
    "pinHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "teacherId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_MARKED',
    "timeIn" TEXT,
    "timeOut" TEXT,
    "totalMinutes" INTEGER,
    "lateMinutes" INTEGER NOT NULL DEFAULT 0,
    "earlyMinutes" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "editedBy" TEXT,
    "editReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AttendanceRecord_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AttendanceRecord_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "school_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '17:00',
    "graceMinutes" INTEGER NOT NULL DEFAULT 15,
    "halfDayMinutes" INTEGER NOT NULL DEFAULT 240,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "weekendDays" TEXT NOT NULL DEFAULT 'Saturday,Sunday',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phoneOrEmail_key" ON "User"("phoneOrEmail");

-- CreateIndex
CREATE INDEX "User_phoneOrEmail_idx" ON "User"("phoneOrEmail");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");

-- CreateIndex
CREATE INDEX "Teacher_department_idx" ON "Teacher"("department");

-- CreateIndex
CREATE INDEX "Teacher_active_idx" ON "Teacher"("active");

-- CreateIndex
CREATE INDEX "AttendanceRecord_date_idx" ON "AttendanceRecord"("date");

-- CreateIndex
CREATE INDEX "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");

-- CreateIndex
CREATE INDEX "AttendanceRecord_teacherId_date_idx" ON "AttendanceRecord"("teacherId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_teacherId_date_key" ON "AttendanceRecord"("teacherId", "date");
