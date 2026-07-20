import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const db = new PrismaClient();

async function main() {
  const password = await argon2.hash("password123", { type: argon2.argon2id });

  const admin = await db.user.upsert({
    where: { email: "admin@lms.test" },
    update: {},
    create: {
      email: "admin@lms.test",
      name: "Alex Admin",
      role: "ADMIN",
      passwordHash: password,
      emailVerifiedAt: new Date(),
    },
  });

  const instructor = await db.user.upsert({
    where: { email: "instructor@lms.test" },
    update: {},
    create: {
      email: "instructor@lms.test",
      name: "Ingrid Instructor",
      role: "INSTRUCTOR",
      passwordHash: password,
      emailVerifiedAt: new Date(),
    },
  });

  const student = await db.user.upsert({
    where: { email: "student@lms.test" },
    update: {},
    create: {
      email: "student@lms.test",
      name: "Sam Student",
      role: "STUDENT",
      passwordHash: password,
      emailVerifiedAt: new Date(),
    },
  });

  const categories = await Promise.all(
    [
      { name: "Web Development", slug: "web-development" },
      { name: "Data Science", slug: "data-science" },
      { name: "Design", slug: "design" },
      { name: "Business", slug: "business" },
    ].map((c) =>
      db.category.upsert({
        where: { slug: c.slug },
        update: {},
        create: c,
      }),
    ),
  );

  // A fully published sample course with two modules and lessons.
  const existing = await db.course.findUnique({
    where: { slug: "intro-to-nextjs" },
  });
  if (!existing) {
    const course = await db.course.create({
      data: {
        title: "Intro to Next.js",
        slug: "intro-to-nextjs",
        summary:
          "Build modern full-stack web apps with the Next.js App Router.",
        description:
          "A hands-on introduction to routing, server components, and data fetching in Next.js 15.",
        status: "PUBLISHED",
        publishedAt: new Date(),
        instructorId: instructor.id,
        categoryId: categories[0]!.id,
        modules: {
          create: [
            {
              title: "Getting Started",
              order: 0,
              lessons: {
                create: [
                  {
                    title: "What is Next.js?",
                    order: 0,
                    contentBlocks: {
                      create: [
                        {
                          type: "TEXT",
                          order: 0,
                          text: "<p>Next.js is a React framework for full-stack web apps.</p>",
                        },
                      ],
                    },
                  },
                  {
                    title: "The App Router",
                    order: 1,
                    contentBlocks: {
                      create: [
                        {
                          type: "VIDEO",
                          order: 0,
                          mediaUrl: "https://www.youtube.com/embed/gSSsZReIFRk",
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              title: "Data & Rendering",
              order: 1,
              lessons: {
                create: [
                  {
                    title: "Server Components",
                    order: 0,
                    contentBlocks: {
                      create: [
                        {
                          type: "TEXT",
                          order: 0,
                          text: "<p>Server Components render on the server for fast, secure data access.</p>",
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    // Enroll the sample student so "My Learning" is populated.
    await db.enrollment.create({
      data: { studentId: student.id, courseId: course.id },
    });
  }

  console.log("Seed complete:", {
    admin: admin.email,
    instructor: instructor.email,
    student: student.email,
    categories: categories.length,
  });
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
