import { db } from "@/server/db";
import { authorize, type Principal } from "@/server/access/policy";
import { NotFoundError } from "@/server/http";
import {
  threadCreateSchema,
  postCreateSchema,
  type ThreadCreateInput,
  type PostCreateInput,
} from "@/lib/validation";
import { notify } from "@/server/services/notification";
import { loadActiveEnrollmentForAuthz } from "@/server/services/enrollment";

/**
 * Course discussions (FR-027). Only the course instructor and students with an
 * active enrollment may read or post. Replies notify the thread author.
 */

/** Authorize that the principal may participate in a course's discussion. */
async function authorizeParticipation(principal: Principal, courseId: string) {
  const course = await db.course.findFirst({
    where: { id: courseId, deletedAt: null },
    select: { id: true, instructorId: true, status: true, visibility: true },
  });
  if (!course) throw new NotFoundError("Course not found.");

  let isEnrolled = true;
  try {
    await loadActiveEnrollmentForAuthz(principal.id, courseId);
  } catch {
    isEnrolled = false;
  }
  authorize(principal, {
    type: "discussion:participate",
    course,
    isEnrolled,
  });
  return course;
}

export async function listThreads(principal: Principal, courseId: string) {
  await authorizeParticipation(principal, courseId);
  return db.discussionThread.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      author: { select: { name: true } },
      _count: { select: { posts: true } },
    },
  });
}

export async function createThread(
  principal: Principal,
  input: ThreadCreateInput,
) {
  const data = threadCreateSchema.parse(input);
  await authorizeParticipation(principal, data.courseId);

  return db.discussionThread.create({
    data: {
      courseId: data.courseId,
      authorId: principal.id,
      title: data.title,
      posts: { create: { authorId: principal.id, body: data.body } },
    },
    select: { id: true },
  });
}

export async function getThread(principal: Principal, threadId: string) {
  const thread = await db.discussionThread.findUnique({
    where: { id: threadId },
    select: {
      id: true,
      title: true,
      courseId: true,
      createdAt: true,
      author: { select: { name: true } },
      course: { select: { slug: true, title: true } },
      posts: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          authorId: true,
          author: { select: { name: true, avatarUrl: true } },
        },
      },
    },
  });
  if (!thread) throw new NotFoundError("Thread not found.");
  await authorizeParticipation(principal, thread.courseId);
  return thread;
}

export async function addPost(principal: Principal, input: PostCreateInput) {
  const data = postCreateSchema.parse(input);
  const thread = await db.discussionThread.findUnique({
    where: { id: data.threadId },
    select: { id: true, courseId: true, authorId: true, title: true },
  });
  if (!thread) throw new NotFoundError("Thread not found.");
  await authorizeParticipation(principal, thread.courseId);

  const post = await db.post.create({
    data: {
      threadId: data.threadId,
      authorId: principal.id,
      body: data.body,
      parentPostId: data.parentPostId ?? null,
    },
  });

  // Notify the thread's original poster of a reply (unless they replied).
  if (thread.authorId !== principal.id) {
    await notify(thread.authorId, {
      type: "DISCUSSION_REPLY",
      title: "New reply to your question",
      body: `Someone replied in "${thread.title}".`,
      linkUrl: `/discussions/${thread.id}`,
    });
  }
  return post;
}
