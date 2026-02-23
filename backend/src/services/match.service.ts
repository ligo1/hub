import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type UserWithRelations = {
  id: string;
  songWishlist: Array<{ songId: string }>;
  instruments: Array<{ instrumentId: string }>;
  availability: Array<{ dayOfWeek: number; timeSlotStart: string; timeSlotEnd: string }>;
};

const COMPLEMENTARY_INSTRUMENTS: Record<string, string[]> = {
  Guitar: ['Drums', 'Bass', 'Vocals', 'Piano'],
  Bass: ['Drums', 'Guitar', 'Vocals', 'Piano'],
  Drums: ['Guitar', 'Bass', 'Vocals', 'Piano'],
  Piano: ['Vocals', 'Guitar', 'Bass', 'Drums'],
  Vocals: ['Guitar', 'Piano', 'Bass', 'Drums'],
};

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function overlapHours(
  a: UserWithRelations['availability'],
  b: UserWithRelations['availability']
): number {
  let totalOverlap = 0;
  for (const slotA of a) {
    for (const slotB of b) {
      if (slotA.dayOfWeek !== slotB.dayOfWeek) continue;
      const startA = parseTime(slotA.timeSlotStart);
      const endA = parseTime(slotA.timeSlotEnd);
      const startB = parseTime(slotB.timeSlotStart);
      const endB = parseTime(slotB.timeSlotEnd);
      const overlapStart = Math.max(startA, startB);
      const overlapEnd = Math.min(endA, endB);
      if (overlapEnd > overlapStart) {
        totalOverlap += (overlapEnd - overlapStart) / 60;
      }
    }
  }
  return totalOverlap;
}

function instrumentScore(
  aInstruments: UserWithRelations['instruments'],
  bInstruments: UserWithRelations['instruments'],
  instrumentNames: Map<string, string>
): number {
  let score = 0;
  for (const ai of aInstruments) {
    const nameA = instrumentNames.get(ai.instrumentId);
    if (!nameA) continue;
    const complementary = COMPLEMENTARY_INSTRUMENTS[nameA] || [];
    for (const bi of bInstruments) {
      const nameB = instrumentNames.get(bi.instrumentId);
      if (!nameB) continue;
      if (complementary.includes(nameB)) score += 1;
      if (nameA === nameB) score -= 0.5; // slight penalty for same instrument
    }
  }
  return Math.max(0, Math.min(1, score / Math.max(aInstruments.length, 1)));
}

export async function computeUserMatches(userId: string) {
  const allUsers = await prisma.user.findMany({
    where: { id: { not: userId } },
    include: {
      songWishlist: true,
      instruments: { include: { instrument: true } },
      availability: true,
    },
  });

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      songWishlist: true,
      instruments: { include: { instrument: true } },
      availability: true,
    },
  });

  if (!currentUser) return [];

  const instrumentNames = new Map<string, string>();
  for (const u of [...allUsers, currentUser]) {
    for (const ui of u.instruments) {
      instrumentNames.set(ui.instrumentId, (ui as any).instrument?.name || ui.instrumentId);
    }
  }

  const currentSongIds = new Set(currentUser.songWishlist.map((s) => s.songId));

  const matchResults = [];

  for (const other of allUsers) {
    const sharedSongs = other.songWishlist.filter((s) => currentSongIds.has(s.songId));
    const sharedSongReasons = sharedSongs.length > 0
      ? [`${sharedSongs.length} shared song${sharedSongs.length > 1 ? 's' : ''} in wishlist`]
      : [];

    const maxSongs = Math.max(currentUser.songWishlist.length, other.songWishlist.length, 1);
    const songScore = (sharedSongs.length / maxSongs) * 40;

    const instScore = instrumentScore(currentUser.instruments, other.instruments, instrumentNames) * 35;
    const instReasons: string[] = [];
    if (instScore > 20) {
      const aNames = currentUser.instruments.map((i) => instrumentNames.get(i.instrumentId) || '').filter(Boolean);
      const bNames = other.instruments.map((i) => instrumentNames.get(i.instrumentId) || '').filter(Boolean);
      instReasons.push(`${aNames.join(' + ')} + ${bNames.join(' + ')}`);
    }

    const overlap = overlapHours(currentUser.availability, other.availability);
    const availScore = Math.min(overlap / 3, 1) * 25;
    const availReasons: string[] = [];
    if (overlap > 0) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const overlappingDays = new Set<number>();
      for (const slotA of currentUser.availability) {
        for (const slotB of other.availability) {
          if (slotA.dayOfWeek === slotB.dayOfWeek) overlappingDays.add(slotA.dayOfWeek);
        }
      }
      if (overlappingDays.size > 0) {
        availReasons.push(`Available ${[...overlappingDays].map((d) => days[d]).join(', ')}`);
      }
    }

    const totalScore = Math.round(songScore + instScore + availScore);
    const reasons = [...sharedSongReasons, ...instReasons, ...availReasons];

    // Upsert match
    const existingA = await prisma.match.findFirst({
      where: { userAId: userId, userBId: other.id },
    });
    const existingB = await prisma.match.findFirst({
      where: { userAId: other.id, userBId: userId },
    });

    if (existingA) {
      await prisma.match.update({
        where: { id: existingA.id },
        data: { score: totalScore, reasons },
      });
    } else if (existingB) {
      await prisma.match.update({
        where: { id: existingB.id },
        data: { score: totalScore, reasons },
      });
    } else {
      await prisma.match.create({
        data: { userAId: userId, userBId: other.id, score: totalScore, reasons },
      });
    }

    matchResults.push({ userId: other.id, score: totalScore, reasons });
  }

  return matchResults.sort((a, b) => b.score - a.score);
}
