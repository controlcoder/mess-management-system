// Menu source: KUBER HEALTH FOOD AND ALLIED SERVICES PVT LTD
// IIIT Bhubaneswar Mess Menu - March 2026 (repeating weekly template)
import "dotenv/config";
// Must be imported before any date calculation so seeding uses the same
// timezone as the API (IST), regardless of the host's timezone.
import "../src/config/timezone.js";
import bcrypt from "bcrypt";
import {
  PrismaClient,
  Branch,
  Gender,
  Hostel,
  MealType,
  PointTransactionType,
  RedemptionStatus,
  Role,
} from "@prisma/client";

const prisma = new PrismaClient();

const BRANCHES = [Branch.CSE, Branch.CE, Branch.IT, Branch.ETC, Branch.EEE];
const DEFAULT_BATCHES = [2023, 2024, 2025, 2026];
const FIRST_NAMES = [
  "Aarav",
  "Aditi",
  "Akash",
  "Ananya",
  "Arjun",
  "Bhavya",
  "Diya",
  "Ishaan",
  "Kavya",
  "Krish",
  "Meera",
  "Neha",
  "Nikhil",
  "Priya",
  "Rhea",
  "Rohit",
  "Saanvi",
  "Sai",
  "Tanvi",
  "Vihaan",
];
const LAST_NAMES = [
  "Acharya",
  "Bhat",
  "Desai",
  "Gowda",
  "Iyer",
  "Kadam",
  "Kulkarni",
  "Naik",
  "Pai",
  "Patil",
  "Rao",
  "Reddy",
  "Sharma",
  "Shetty",
  "Singh",
  "Varma",
];

const EXTRA_ITEMS = [
  { name: "Omelette", pointsCost: 30, description: "Fresh two-egg omelette." },
  { name: "Lassi", pointsCost: 20, description: "Sweet chilled lassi." },
  { name: "Curd", pointsCost: 15, description: "Plain curd cup." },
  { name: "Boiled Eggs", pointsCost: 20, description: "Two boiled eggs." },
  {
    name: "Fruit Bowl",
    pointsCost: 25,
    description: "Seasonal cut fruit bowl.",
  },
];

const WEEKLY_MENU_TEMPLATE = {
  BREAKFAST: [
    ["Upma", "Matar Curry", "Tea"],
    ["Idli", "Sambar", "Chutney"],
    ["Dahi Bara", "Aloo Dum"],
    ["Upma", "Matar Curry", "Tea/Coffee"],
    ["Uttapam / Masala Chakuli", "Sambar", "Chutney"],
    ["Khakra / Kakera", "Aloo Chop", "Matar Curry"],
    ["Vada", "Matar Curry"],
  ],

  LUNCH: [
    ["Rice", "Roti", "Dalma", "Tomato / Khatta", "Onion Salad"],
    ["Rice", "Roti", "Dal", "Rajma", "Dahi Boondi", "Fryums", "Sambar"],
    ["Rice", "Roti", "Dal", "Chicken (3 pcs) Curry / Paneer Curry", "Salad"],
    [
      "Rice",
      "Roti",
      "Moong Dal",
      "Aloo",
      "Aloo Bharta",
      "Patta Gobi",
      "Dahi Baingan",
    ],
    ["Rice", "Roti", "Ahar Dal", "Fish Curry / Palak Paneer", "Salad"],
    ["Rice", "Roti", "Egg Curry", "Navratna Korma", "Papad"],
    ["Chicken / Veg Biryani", "Raita", "Gulab Jamun"],
  ],

  SNACKS: [
    ["Vada", "Bread Pakoda", "Pyazi", "Samosa"],
    ["Vada", "Bread Pakoda", "Pyazi", "Samosa"],
    ["Vada", "Bread Pakoda", "Pyazi", "Samosa"],
    ["Vada", "Bread Pakoda", "Pyazi", "Samosa"],
    ["Vada", "Bread Pakoda", "Pyazi", "Samosa"],
    ["Vada", "Bread Pakoda", "Pyazi", "Samosa"],
    ["Vada", "Bread Pakoda", "Pyazi", "Samosa"],
  ],

  DINNER: [
    ["Rice", "Roti", "Paneer Masala"],
    ["Rice", "Roti", "Aloo Phool Gobi Kasa", "Egg Curry"],
    ["Rice", "Roti", "Egg Tadka", "Chilli Soybean", "Gulab Jamun"],
    ["Chole Bhature", "Curd", "Achar"],
    ["Rice", "Roti", "Paneer", "Chicken Kasa (3 pcs)"],
    ["Rice", "Roti", "Chilli Gobi"],
    ["Rice", "Roti", "Chicken Kasa (3 pcs) / Paneer Hyderabadi"],
  ],
};

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function startOfWeek(date) {
  const value = startOfDay(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value;
}

function addDays(date, days) {
  const value = new Date(date);
  value.setDate(value.getDate() + days);
  return value;
}

function mealDeadline(mealDate, mealType) {
  const deadline = new Date(mealDate);
  deadline.setSeconds(0, 0);

  if (mealType === MealType.BREAKFAST) {
    deadline.setDate(deadline.getDate() - 1);
    deadline.setHours(21, 0, 0, 0);
    return deadline;
  }

  if (mealType === MealType.LUNCH) {
    deadline.setHours(9, 0, 0, 0);
    return deadline;
  }

  if (mealType === MealType.SNACKS) {
    deadline.setHours(13, 0, 0, 0);
    return deadline;
  }

  deadline.setHours(16, 0, 0, 0);
  return deadline;
}

function buildRollNumber(batchYear, branch, serial) {
  let branchId = 4;

  if (branch === Branch.CSE) branchId = 1;
  else if (branch === Branch.CE) branchId = 5;
  else if (branch === Branch.ETC) branchId = 2;
  else if (branch === Branch.EEE) branchId = 3;

  const year = String(batchYear).slice(-2);
  const paddedSerial = String(serial).padStart(3, "0");

  return `b${branchId}${year}${paddedSerial}`;
}

function buildStudentName(batchYear, branch, serial, gender) {
  const firstOffset =
    (batchYear + serial + branch.charCodeAt(0)) % FIRST_NAMES.length;
  const lastOffset =
    (batchYear + serial + branch.charCodeAt(branch.length - 1)) %
    LAST_NAMES.length;
  const prefix = gender === Gender.FEMALE ? "Ms." : "Mr.";
  return `${prefix} ${FIRST_NAMES[firstOffset]} ${LAST_NAMES[lastOffset]}`;
}

function buildMenuEntry(dayIndex, mealType, mealDate) {
  const items = WEEKLY_MENU_TEMPLATE[mealType][dayIndex];
  return {
    mealDate,
    mealType,
    title: items[0],
    description: items.slice(1).join(", "),
    items,
  };
}

function createMealEntries(weekStart) {
  const entries = [];
  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const mealDate = addDays(weekStart, dayIndex);
    entries.push(buildMenuEntry(dayIndex, MealType.BREAKFAST, mealDate));
    entries.push(buildMenuEntry(dayIndex, MealType.LUNCH, mealDate));
    entries.push(buildMenuEntry(dayIndex, MealType.SNACKS, mealDate));
    entries.push(buildMenuEntry(dayIndex, MealType.DINNER, mealDate));
  }
  return entries;
}

function sampleEligibleStudents(studentUsers, divisor, remainder) {
  return studentUsers.filter((_, index) => index % divisor === remainder);
}

function addHours(date, hours) {
  const value = new Date(date);
  value.setHours(value.getHours() + hours);
  return value;
}

function buildRedemptionCode(rollNumber, itemName, index) {
  const itemToken = itemName.replace(/\s+/g, "").slice(0, 3).toUpperCase();
  return `${itemToken}-${rollNumber.slice(-4)}-${String(index + 1).padStart(3, "0")}`;
}

async function main() {
  const defaultStudentPassword =
    process.env.DEFAULT_STUDENT_PASSWORD || "student123";
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "admin123";
  const batches = DEFAULT_BATCHES;

  const studentPasswordHash = await bcrypt.hash(defaultStudentPassword, 12);
  const adminPasswordHash = await bcrypt.hash(defaultAdminPassword, 12);

  await prisma.mealRating.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.redemption.deleteMany();
  await prisma.extraItem.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.mealOptOut.deleteMany();
  await prisma.menuEntry.deleteMany();
  await prisma.menuWeek.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.user.deleteMany();

  const admins = [
    {
      username: "admin",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
    {
      username: "messmanager",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  ];

  const createdAdmins = [];
  for (const admin of admins) {
    const user = await prisma.user.create({ data: admin });
    createdAdmins.push(user);
  }

  const primaryAdmin = createdAdmins[0];
  const studentUsers = [];

  for (const batchYear of batches) {
    for (const branch of BRANCHES) {
      for (let serial = 1; serial <= 2; serial += 1) {
        const gender = serial <= 30 ? Gender.MALE : Gender.FEMALE;
        const hostel = serial <= 30 ? Hostel.BOYS : Hostel.GIRLS;
        const rollNumber = buildRollNumber(batchYear, branch, serial);

        const user = await prisma.user.create({
          data: {
            rollNumber,
            passwordHash: studentPasswordHash,
            role: Role.STUDENT,
            studentProfile: {
              create: {
                fullName: buildStudentName(batchYear, branch, serial, gender),
                batchYear,
                branch,
                serial,
                gender,
                hostel,
                messName:
                  hostel === Hostel.BOYS
                    ? "Boys Hostel Mess"
                    : "Girls Hostel Mess",
              },
            },
          },
          include: {
            studentProfile: true,
          },
        });

        studentUsers.push(user);
      }
    }
  }

  for (const item of EXTRA_ITEMS) {
    await prisma.extraItem.create({ data: item });
  }

  const currentWeekStart = startOfWeek(new Date());
  const previousWeekStart = addDays(currentWeekStart, -7);
  const seededWeeks = [];

  for (const weekStart of [previousWeekStart, currentWeekStart]) {
    const createdWeek = await prisma.menuWeek.create({
      data: {
        weekStart,
        createdById: primaryAdmin.id,
        entries: {
          create: createMealEntries(weekStart),
        },
      },
      include: {
        entries: true,
      },
    });
    seededWeeks.push(createdWeek);
  }

  const currentWeek = seededWeeks.find(
    (week) => week.weekStart.getTime() === currentWeekStart.getTime(),
  );
  const today = startOfDay(new Date());
  const todayEntries = currentWeek.entries.filter(
    (entry) => startOfDay(entry.mealDate).getTime() === today.getTime(),
  );
  const lunchEntry = todayEntries.find(
    (entry) => entry.mealType === MealType.LUNCH,
  );
  const dinnerEntry = todayEntries.find(
    (entry) => entry.mealType === MealType.DINNER,
  );
  const yesterday = addDays(today, -1);
  const yesterdaySourceWeek =
    yesterday < currentWeekStart
      ? seededWeeks.find(
          (week) => week.weekStart.getTime() === previousWeekStart.getTime(),
        )
      : currentWeek;
  const yesterdayEntries = yesterdaySourceWeek.entries.filter(
    (entry) => startOfDay(entry.mealDate).getTime() === yesterday.getTime(),
  );
  const breakfastEntry = yesterdayEntries.find(
    (entry) => entry.mealType === MealType.BREAKFAST,
  );

  const earlyOptOutStudents = sampleEligibleStudents(studentUsers, 12, 0);
  for (const student of earlyOptOutStudents) {
    const entry = lunchEntry || dinnerEntry;
    if (!entry) {
      continue;
    }

    const pointsAwarded = 10;
    const deadlineAt = mealDeadline(entry.mealDate, entry.mealType);
    await prisma.mealOptOut.create({
      data: {
        userId: student.id,
        menuEntryId: entry.id,
        deadlineAt,
        optedOutAt: addHours(deadlineAt, -4),
        isBeforeDeadline: true,
        pointsAwarded,
      },
    });

    await prisma.pointTransaction.create({
      data: {
        userId: student.id,
        type: PointTransactionType.EARNED_OPT_OUT,
        points: pointsAwarded,
        description: `Earned for opting out of ${entry.mealType.toLowerCase()} on ${entry.mealDate.toISOString().slice(0, 10)}`,
        referenceId: entry.id,
      },
    });

    await prisma.user.update({
      where: { id: student.id },
      data: {
        pointsBalance: {
          increment: pointsAwarded,
        },
      },
    });
  }

  const lateOptOutStudents = sampleEligibleStudents(studentUsers, 15, 1);
  for (const student of lateOptOutStudents) {
    if (!dinnerEntry) {
      continue;
    }

    const deadlineAt = mealDeadline(dinnerEntry.mealDate, dinnerEntry.mealType);
    await prisma.mealOptOut.create({
      data: {
        userId: student.id,
        menuEntryId: dinnerEntry.id,
        deadlineAt,
        optedOutAt: addHours(deadlineAt, 2),
        isBeforeDeadline: false,
        pointsAwarded: 0,
      },
    });
  }

  const bonusStudents = earlyOptOutStudents.slice(0, 25);
  for (const student of bonusStudents) {
    await prisma.pointTransaction.create({
      data: {
        userId: student.id,
        type: PointTransactionType.MANUAL_ADJUSTMENT,
        points: 30,
        description: "Seed bonus points for redemption demo",
      },
    });

    await prisma.user.update({
      where: { id: student.id },
      data: {
        pointsBalance: {
          increment: 30,
        },
      },
    });
  }

  const attendanceStudents = sampleEligibleStudents(studentUsers, 8, 0);
  for (const student of attendanceStudents) {
    if (!breakfastEntry) {
      continue;
    }

    await prisma.attendance.create({
      data: {
        userId: student.id,
        menuEntryId: breakfastEntry.id,
        wasPresent: true,
      },
    });

    await prisma.mealRating.create({
      data: {
        userId: student.id,
        menuEntryId: breakfastEntry.id,
        rating: (student.studentProfile.serial % 5) + 1,
        comment: "Seeded feedback entry.",
      },
    });
  }

  const extraItems = await prisma.extraItem.findMany({
    orderBy: { pointsCost: "asc" },
  });
  const redemptionStudents = earlyOptOutStudents.slice(
    0,
    Math.min(25, earlyOptOutStudents.length),
  );
  for (let index = 0; index < redemptionStudents.length; index += 1) {
    const student = redemptionStudents[index];
    const item = extraItems[index % extraItems.length];

    const pointsSpent = item.pointsCost;
    await prisma.redemption.create({
      data: {
        userId: student.id,
        extraItemId: item.id,
        pointsSpent,
        redemptionCode: buildRedemptionCode(
          student.rollNumber,
          item.name,
          index,
        ),
        status:
          index % 4 === 0
            ? RedemptionStatus.FULFILLED
            : RedemptionStatus.ACTIVE,
        expiresAt: addDays(new Date(), 1),
        fulfilledAt: index % 4 === 0 ? new Date() : null,
      },
    });

    await prisma.pointTransaction.create({
      data: {
        userId: student.id,
        type: PointTransactionType.REDEEMED_EXTRA,
        points: -pointsSpent,
        description: `Redeemed ${item.name}`,
        referenceId: item.id,
      },
    });

    await prisma.user.update({
      where: { id: student.id },
      data: {
        pointsBalance: {
          decrement: pointsSpent,
        },
      },
    });
  }

  console.log(
    `Seed completed with ${studentUsers.length} students, ${createdAdmins.length} admins, and ${seededWeeks.length} menu weeks.`,
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
