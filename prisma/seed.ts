import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const PW = "Password123!";

async function main() {
  const passwordHash = await bcrypt.hash(PW, 10);

  const [admin, instructor, student] = await Promise.all([
    db.user.upsert({
      where: { email: "admin@example.com" },
      update: {},
      create: {
        email: "admin@example.com",
        name: "Alex Diaz",
        role: "ADMIN",
        passwordHash,
      },
    }),
    db.user.upsert({
      where: { email: "instructor@example.com" },
      update: {},
      create: {
        email: "instructor@example.com",
        name: "Maya Reyes",
        role: "INSTRUCTOR",
        passwordHash,
      },
    }),
    db.user.upsert({
      where: { email: "student@example.com" },
      update: {},
      create: {
        email: "student@example.com",
        name: "Jordan Tan",
        role: "STUDENT",
        passwordHash,
      },
    }),
  ]);

  const category = await db.category.upsert({
    where: { slug: "data-analytics" },
    update: {},
    create: {
      name: "Data & Analytics",
      slug: "data-analytics",
      description: "Learn to turn data into decisions.",
    },
  });

  // A fully published sample course so the catalog + player work out of the box.
  const existing = await db.course.findUnique({
    where: { slug: "foundations-of-data-analysis" },
  });

  if (!existing) {
    const course = await db.course.create({
      data: {
        title: "Foundations of Data Analysis",
        slug: "foundations-of-data-analysis",
        summary: "Go from raw data to a defensible insight.",
        description:
          "A hands-on introduction to loading, cleaning, and reasoning about data. By the end you can take a messy CSV and produce a clear, decision-ready summary.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        instructorId: instructor.id,
        categoryId: category.id,
      },
    });

    const m1 = await db.module.create({
      data: { courseId: course.id, title: "Getting oriented", order: 0 },
    });
    const m2 = await db.module.create({
      data: { courseId: course.id, title: "Working with data", order: 1 },
    });

    const lessons = [
      { moduleId: m1.id, title: "Welcome & setup", order: 0 },
      { moduleId: m1.id, title: "What is analysis?", order: 1 },
      { moduleId: m2.id, title: "Loading a dataset", order: 0 },
      { moduleId: m2.id, title: "A cleaning checklist", order: 1 },
    ];
    for (const l of lessons) {
      const lesson = await db.lesson.create({ data: { ...l, isRequired: true } });
      await db.contentBlock.create({
        data: {
          lessonId: lesson.id,
          type: "TEXT",
          order: 0,
          text: `Notes for “${l.title}”. Replace with real content in the builder.`,
        },
      });
    }

    // Enroll the demo student and complete the first lesson.
    const enrollment = await db.enrollment.create({
      data: { studentId: student.id, courseId: course.id, progressPercent: 25 },
    });
    const first = await db.lesson.findFirst({
      where: { moduleId: m1.id, order: 0 },
    });
    if (first) {
      await db.lessonProgress.create({
        data: {
          enrollmentId: enrollment.id,
          lessonId: first.id,
          completedAt: new Date(),
        },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`  admin@example.com / ${PW}`);
  console.log(`  instructor@example.com / ${PW}`);
  console.log(`  student@example.com / ${PW}`);
  void admin;
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
