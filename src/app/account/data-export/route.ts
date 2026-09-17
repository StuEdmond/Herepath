import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { users, reviews, savedRides, diaryEntries, diaryEntryPhotos } from "@/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const userId = session.user.id;
  const [user] = await db.select().from(users).where(eq(users.id, userId));
  const [userReviews, userSavedRides, userDiaryEntries] = await Promise.all([
    db.select().from(reviews).where(eq(reviews.userId, userId)),
    db.select().from(savedRides).where(eq(savedRides.userId, userId)),
    db.select().from(diaryEntries).where(eq(diaryEntries.userId, userId)),
  ]);

  const entryIds = userDiaryEntries.map((e) => e.id);
  const photos = entryIds.length > 0 ? await db.select().from(diaryEntryPhotos) : [];
  const userPhotos = photos.filter((p) => entryIds.includes(p.diaryEntryId));

  const exportData = {
    exportedAt: new Date().toISOString(),
    profile: user ? { name: user.name, email: user.email, mainBike: user.mainBike, memberSince: user.memberSince } : null,
    reviews: userReviews,
    savedRides: userSavedRides,
    diaryEntries: userDiaryEntries.map((entry) => ({ ...entry, photos: userPhotos.filter((p) => p.diaryEntryId === entry.id) })),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="herepath-data-export.json"`,
    },
  });
}
