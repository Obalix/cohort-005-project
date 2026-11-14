import { and, desc, eq } from "drizzle-orm";
import { bookmarks } from "~/db/schema";
import type { Db } from "~/lib/comments.server";
import { joinSavedLesson, savedLessonColumns } from "~/lib/saved-lesson.server";

// ─── Bookmarks ───
// A Student's flag on a Lesson. One per Student per Lesson, enforced by the
// unique index on (user_id, lesson_id). See GLOSSARY.md.
//
// Every function takes the database first, so tests can hand in an in-memory
// one. Content access is the caller's job: the Lesson action checks it before
// calling in.

function findBookmark(db: Db, userId: number, lessonId: number) {
  return db
    .select({ id: bookmarks.id })
    .from(bookmarks)
    .where(and(eq(bookmarks.userId, userId), eq(bookmarks.lessonId, lessonId)))
    .get();
}

export function isBookmarked(db: Db, userId: number, lessonId: number) {
  return !!findBookmark(db, userId, lessonId);
}

/**
 * Adds the Bookmark if the Lesson has none, removes it if it has one.
 * Returns whether the Lesson is bookmarked afterwards.
 */
export function toggleBookmark(
  db: Db,
  userId: number,
  lessonId: number,
  now: Date
): boolean {
  const existing = findBookmark(db, userId, lessonId);

  if (existing) {
    db.delete(bookmarks).where(eq(bookmarks.id, existing.id)).run();
    return false;
  }

  // A concurrent toggle may have inserted first; the unique index keeps it
  // at one row either way.
  db.insert(bookmarks)
    .values({ userId, lessonId, createdAt: now.toISOString() })
    .onConflictDoNothing()
    .run();
  return true;
}

/** The Student's Bookmarks with their Lesson and Course, newest first. */
export function listBookmarks(db: Db, userId: number) {
  const query = db
    .select({
      id: bookmarks.id,
      createdAt: bookmarks.createdAt,
      ...savedLessonColumns,
    })
    .from(bookmarks)
    .$dynamic();

  return joinSavedLesson(query, bookmarks.lessonId)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
    .all();
}
