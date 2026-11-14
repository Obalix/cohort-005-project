import { eq } from "drizzle-orm";
import type { SQLiteColumn, SQLiteSelect } from "drizzle-orm/sqlite-core";
import { courses, lessons, modules } from "~/db/schema";

// ─── Saved Lesson ───
// What a row on the Saved page needs to link back to its Lesson and name its
// Course. Shared by the Bookmark and Note lists.

export const savedLessonColumns = {
  lessonId: lessons.id,
  lessonTitle: lessons.title,
  moduleTitle: modules.title,
  courseTitle: courses.title,
  courseSlug: courses.slug,
};

/** Joins a dynamic query from `lessonId` through to the Lesson's Course. */
export function joinSavedLesson<T extends SQLiteSelect>(
  query: T,
  lessonId: SQLiteColumn
) {
  return query
    .innerJoin(lessons, eq(lessonId, lessons.id))
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .innerJoin(courses, eq(modules.courseId, courses.id));
}
