import { PrismaClient, SkillLevel, Frequency, SessionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Instruments
  const instruments = await Promise.all([
    prisma.instrument.upsert({ where: { name: 'Guitar' }, update: {}, create: { name: 'Guitar', icon: '🎸' } }),
    prisma.instrument.upsert({ where: { name: 'Bass' }, update: {}, create: { name: 'Bass', icon: '🎸' } }),
    prisma.instrument.upsert({ where: { name: 'Drums' }, update: {}, create: { name: 'Drums', icon: '🥁' } }),
    prisma.instrument.upsert({ where: { name: 'Piano' }, update: {}, create: { name: 'Piano', icon: '🎹' } }),
    prisma.instrument.upsert({ where: { name: 'Vocals' }, update: {}, create: { name: 'Vocals', icon: '🎤' } }),
  ]);

  const [guitar, bass, drums, piano, vocals] = instruments;

  // Songs
  const wonderwall = await prisma.song.upsert({
    where: { id: 'song-wonderwall' },
    update: {},
    create: {
      id: 'song-wonderwall',
      title: 'Wonderwall',
      artist: 'Oasis',
      genre: 'Rock',
      key: 'Am',
      bpm: 87,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                {
                  order: 1,
                  lyricText: 'Today is gonna be the day',
                  chords: {
                    create: [
                      { chord: 'Em7', beatPosition: 0.0 },
                      { chord: 'G', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 2,
                  lyricText: 'That they\'re gonna throw it back to you',
                  chords: {
                    create: [
                      { chord: 'Dsus4', beatPosition: 0.0 },
                      { chord: 'A7sus4', beatPosition: 0.6 },
                    ],
                  },
                },
                {
                  order: 3,
                  lyricText: 'By now you should\'ve somehow',
                  chords: {
                    create: [
                      { chord: 'Em7', beatPosition: 0.0 },
                      { chord: 'G', beatPosition: 0.55 },
                    ],
                  },
                },
                {
                  order: 4,
                  lyricText: 'Realized what you gotta do',
                  chords: {
                    create: [
                      { chord: 'Dsus4', beatPosition: 0.0 },
                      { chord: 'A7sus4', beatPosition: 0.5 },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                {
                  order: 1,
                  lyricText: 'And all the roads we have to walk are winding',
                  chords: {
                    create: [
                      { chord: 'F', beatPosition: 0.0 },
                      { chord: 'G', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 2,
                  lyricText: 'And all the lights that lead us there are blinding',
                  chords: {
                    create: [
                      { chord: 'Am', beatPosition: 0.0 },
                      { chord: 'G', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 3,
                  lyricText: 'Maybe you\'re gonna be the one that saves me',
                  chords: {
                    create: [
                      { chord: 'F', beatPosition: 0.0 },
                      { chord: 'G', beatPosition: 0.45 },
                      { chord: 'Am', beatPosition: 0.8 },
                    ],
                  },
                },
                {
                  order: 4,
                  lyricText: 'And after all, you\'re my wonderwall',
                  chords: {
                    create: [
                      { chord: 'F', beatPosition: 0.0 },
                      { chord: 'G', beatPosition: 0.5 },
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

  const hotelCalifornia = await prisma.song.upsert({
    where: { id: 'song-hotel-california' },
    update: {},
    create: {
      id: 'song-hotel-california',
      title: 'Hotel California',
      artist: 'Eagles',
      genre: 'Rock',
      key: 'Bm',
      bpm: 75,
      sections: {
        create: [
          {
            name: 'Intro / Verse',
            order: 1,
            lines: {
              create: [
                {
                  order: 1,
                  lyricText: 'On a dark desert highway, cool wind in my hair',
                  chords: {
                    create: [
                      { chord: 'Bm', beatPosition: 0.0 },
                      { chord: 'F#', beatPosition: 0.45 },
                    ],
                  },
                },
                {
                  order: 2,
                  lyricText: 'Warm smell of colitas rising up through the air',
                  chords: {
                    create: [
                      { chord: 'A', beatPosition: 0.0 },
                      { chord: 'E', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 3,
                  lyricText: 'Up ahead in the distance, I saw a shimmering light',
                  chords: {
                    create: [
                      { chord: 'G', beatPosition: 0.0 },
                      { chord: 'D', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 4,
                  lyricText: 'My head grew heavy and my sight grew dim',
                  chords: {
                    create: [
                      { chord: 'Em', beatPosition: 0.0 },
                      { chord: 'F#', beatPosition: 0.55 },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                {
                  order: 1,
                  lyricText: 'Welcome to the Hotel California',
                  chords: {
                    create: [
                      { chord: 'Bm', beatPosition: 0.0 },
                      { chord: 'F#', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 2,
                  lyricText: 'Such a lovely place, such a lovely face',
                  chords: {
                    create: [
                      { chord: 'A', beatPosition: 0.0 },
                      { chord: 'E', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 3,
                  lyricText: 'Plenty of room at the Hotel California',
                  chords: {
                    create: [
                      { chord: 'G', beatPosition: 0.0 },
                      { chord: 'D', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 4,
                  lyricText: 'Any time of year you can find it here',
                  chords: {
                    create: [
                      { chord: 'Em', beatPosition: 0.0 },
                      { chord: 'F#', beatPosition: 0.55 },
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

  const letHerGo = await prisma.song.upsert({
    where: { id: 'song-let-her-go' },
    update: {},
    create: {
      id: 'song-let-her-go',
      title: 'Let Her Go',
      artist: 'Passenger',
      genre: 'Folk',
      key: 'G',
      bpm: 109,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                {
                  order: 1,
                  lyricText: 'Well you only need the light when it\'s burning low',
                  chords: {
                    create: [
                      { chord: 'C', beatPosition: 0.0 },
                      { chord: 'G', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 2,
                  lyricText: 'Only miss the sun when it starts to snow',
                  chords: {
                    create: [
                      { chord: 'Dsus4', beatPosition: 0.0 },
                      { chord: 'Em', beatPosition: 0.55 },
                    ],
                  },
                },
                {
                  order: 3,
                  lyricText: 'Only know you love her when you let her go',
                  chords: {
                    create: [
                      { chord: 'C', beatPosition: 0.0 },
                      { chord: 'G', beatPosition: 0.45 },
                      { chord: 'Dsus4', beatPosition: 0.75 },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                {
                  order: 1,
                  lyricText: 'And you let her go',
                  chords: {
                    create: [
                      { chord: 'G', beatPosition: 0.0 },
                      { chord: 'Dsus4', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 2,
                  lyricText: 'Staring at the bottom of your glass',
                  chords: {
                    create: [
                      { chord: 'Em', beatPosition: 0.0 },
                      { chord: 'C', beatPosition: 0.5 },
                    ],
                  },
                },
                {
                  order: 3,
                  lyricText: 'Hoping one day you\'ll make a dream last',
                  chords: {
                    create: [
                      { chord: 'G', beatPosition: 0.0 },
                      { chord: 'Dsus4', beatPosition: 0.5 },
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

  // ── Additional Songs ────────────────────────────────────────────────────────

  await prisma.song.upsert({
    where: { id: 'song-knockin-heaven' },
    update: {},
    create: {
      id: 'song-knockin-heaven',
      title: "Knockin' on Heaven's Door",
      artist: 'Bob Dylan',
      genre: 'Rock',
      key: 'G',
      bpm: 73,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: "Mama, take this badge off of me", chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
                { order: 2, lyricText: "I can't use it anymore", chords: { create: [{ chord: 'Am', beatPosition: 0.0 }] } },
                { order: 3, lyricText: "It's gettin' dark, too dark to see", chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
                { order: 4, lyricText: "I feel I'm knockin' on heaven's door", chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.6 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: "Knock knock knockin' on heaven's door", chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.5 }] } },
                { order: 2, lyricText: "Knock knock knockin' on heaven's door", chords: { create: [{ chord: 'Am', beatPosition: 0.0 }] } },
                { order: 3, lyricText: "Knock knock knockin' on heaven's door", chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-house-rising-sun' },
    update: {},
    create: {
      id: 'song-house-rising-sun',
      title: 'House of the Rising Sun',
      artist: 'The Animals',
      genre: 'Blues',
      key: 'Am',
      bpm: 95,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'There is a house in New Orleans', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
                { order: 2, lyricText: "They call the Rising Sun", chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
                { order: 3, lyricText: "And it's been the ruin of many a poor boy", chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
                { order: 4, lyricText: "And God I know I'm one", chords: { create: [{ chord: 'E', beatPosition: 0.0 }] } },
              ],
            },
          },
          {
            name: 'Verse 2',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'My mother was a tailor', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
                { order: 2, lyricText: 'She sewed my new blue jeans', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'My father was a gambling man', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'E', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-wish-you-were-here' },
    update: {},
    create: {
      id: 'song-wish-you-were-here',
      title: 'Wish You Were Here',
      artist: 'Pink Floyd',
      genre: 'Rock',
      key: 'G',
      bpm: 63,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'So, so you think you can tell', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.6 }] } },
                { order: 2, lyricText: 'Heaven from Hell, blue skies from pain', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.6 }] } },
                { order: 3, lyricText: 'Can you tell a green field from a cold steel rail', chords: { create: [{ chord: 'A', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'How I wish, how I wish you were here', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.5 }] } },
                { order: 2, lyricText: "We're just two lost souls swimming in a fish bowl", chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Wish you were here', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.5 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-sweet-child' },
    update: {},
    create: {
      id: 'song-sweet-child',
      title: "Sweet Child O' Mine",
      artist: "Guns N' Roses",
      genre: 'Rock',
      key: 'D',
      bpm: 125,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'She got a smile it seems to me', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Reminds me of childhood memories', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Where everything was as fresh as the bright blue sky', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: "Where do we go, where do we go now", chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
                { order: 2, lyricText: "Sweet child o' mine", chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.6 }] } },
                { order: 3, lyricText: "Where do we go now", chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.6 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-dont-stop-believin' },
    update: {},
    create: {
      id: 'song-dont-stop-believin',
      title: "Don't Stop Believin'",
      artist: 'Journey',
      genre: 'Rock',
      key: 'E',
      bpm: 120,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'Just a small town girl', chords: { create: [{ chord: 'E', beatPosition: 0.0 }, { chord: 'B', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Livin\' in a lonely world', chords: { create: [{ chord: 'C#m', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'She took the midnight train goin\' anywhere', chords: { create: [{ chord: 'E', beatPosition: 0.0 }, { chord: 'B', beatPosition: 0.5 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: "Don't stop believin'", chords: { create: [{ chord: 'E', beatPosition: 0.0 }, { chord: 'B', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Hold on to the feelin\'', chords: { create: [{ chord: 'C#m', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Streetlight, people', chords: { create: [{ chord: 'E', beatPosition: 0.0 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-brown-eyed-girl' },
    update: {},
    create: {
      id: 'song-brown-eyed-girl',
      title: 'Brown Eyed Girl',
      artist: 'Van Morrison',
      genre: 'Pop',
      key: 'G',
      bpm: 150,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'Hey where did we go', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
                { order: 2, lyricText: 'Days when the rains came', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Down in the hollow, playing a new game', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.5 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'Do you remember when we used to sing', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Sha la la la la la la la la la la te da', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Em', beatPosition: 0.5 }] } },
                { order: 3, lyricText: 'My brown eyed girl', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-with-or-without-you' },
    update: {},
    create: {
      id: 'song-with-or-without-you',
      title: 'With or Without You',
      artist: 'U2',
      genre: 'Rock',
      key: 'D',
      bpm: 110,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'See the stone set in your eyes', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.5 }] } },
                { order: 2, lyricText: 'See the thorn twist in your side', chords: { create: [{ chord: 'Bm', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.5 }] } },
                { order: 3, lyricText: 'I wait for you', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.6 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'And you give yourself away', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'With or without you, with or without you', chords: { create: [{ chord: 'Bm', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.5 }] } },
                { order: 3, lyricText: 'I can\'t live with or without you', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-come-as-you-are' },
    update: {},
    create: {
      id: 'song-come-as-you-are',
      title: 'Come As You Are',
      artist: 'Nirvana',
      genre: 'Grunge',
      key: 'Em',
      bpm: 120,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'Come as you are, as you were', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }, { chord: 'Am', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'As I want you to be', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }] } },
                { order: 3, lyricText: 'As a friend, as a friend, as an old enemy', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'Em', beatPosition: 0.6 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'And I swear that I don\'t have a gun', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }, { chord: 'Am', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'No I don\'t have a gun', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }] } },
                { order: 3, lyricText: 'Memoria, ah ah', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'Em', beatPosition: 0.6 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-good-riddance' },
    update: {},
    create: {
      id: 'song-good-riddance',
      title: 'Good Riddance (Time of Your Life)',
      artist: 'Green Day',
      genre: 'Punk',
      key: 'G',
      bpm: 78,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'Another turning point, a fork stuck in the road', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Cadd9', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Time grabs you by the wrist, directs you where to go', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Cadd9', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'So make the best of this test and don\'t ask why', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }, { chord: 'Cadd9', beatPosition: 0.5 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'It\'s something unpredictable, but in the end it\'s right', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Em', beatPosition: 0.5 }] } },
                { order: 2, lyricText: 'I hope you had the time of your life', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-creep' },
    update: {},
    create: {
      id: 'song-creep',
      title: 'Creep',
      artist: 'Radiohead',
      genre: 'Alternative',
      key: 'G',
      bpm: 92,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'When you were here before', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'B', beatPosition: 0.55 }] } },
                { order: 2, lyricText: "Couldn't look you in the eye", chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'Cm', beatPosition: 0.55 }] } },
                { order: 3, lyricText: "You're just like an angel", chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'B', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: "But I'm a creep, I'm a weirdo", chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'B', beatPosition: 0.5 }] } },
                { order: 2, lyricText: "What the hell am I doing here", chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'Cm', beatPosition: 0.55 }] } },
                { order: 3, lyricText: "I don't belong here", chords: { create: [{ chord: 'G', beatPosition: 0.0 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-stand-by-me' },
    update: {},
    create: {
      id: 'song-stand-by-me',
      title: 'Stand By Me',
      artist: 'Ben E. King',
      genre: 'Soul',
      key: 'A',
      bpm: 115,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: "When the night has come and the land is dark", chords: { create: [{ chord: 'A', beatPosition: 0.0 }, { chord: 'F#m', beatPosition: 0.55 }] } },
                { order: 2, lyricText: "And the moon is the only light we'll see", chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'E', beatPosition: 0.55 }] } },
                { order: 3, lyricText: "No I won't be afraid, no I won't be afraid", chords: { create: [{ chord: 'A', beatPosition: 0.0 }, { chord: 'F#m', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'Darling, stand by me', chords: { create: [{ chord: 'A', beatPosition: 0.0 }, { chord: 'F#m', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Oh stand by me, oh stand', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'E', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Stand by me, stand by me', chords: { create: [{ chord: 'A', beatPosition: 0.0 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-redemption-song' },
    update: {},
    create: {
      id: 'song-redemption-song',
      title: 'Redemption Song',
      artist: 'Bob Marley',
      genre: 'Reggae',
      key: 'G',
      bpm: 75,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'Old pirates yes they rob I', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Em', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Sold I to the merchant ships', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'Am', beatPosition: 0.5 }] } },
                { order: 3, lyricText: 'Minutes after they took I from the bottomless pit', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'Emancipate yourselves from mental slavery', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'None but ourselves can free our minds', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Sing songs of freedom', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-blackbird' },
    update: {},
    create: {
      id: 'song-blackbird',
      title: 'Blackbird',
      artist: 'The Beatles',
      genre: 'Rock',
      key: 'G',
      bpm: 96,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'Blackbird singing in the dead of night', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Am7', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Take these broken wings and learn to fly', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
                { order: 3, lyricText: 'All your life', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Em', beatPosition: 0.5 }] } },
              ],
            },
          },
          {
            name: 'Bridge',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'Blackbird fly, blackbird fly', chords: { create: [{ chord: 'F', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
                { order: 2, lyricText: 'Into the light of the dark black night', chords: { create: [{ chord: 'Dm', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.5 }] } },
                { order: 3, lyricText: 'Blackbird fly', chords: { create: [{ chord: 'Bb', beatPosition: 0.0 }, { chord: 'C', beatPosition: 0.6 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-mad-world' },
    update: {},
    create: {
      id: 'song-mad-world',
      title: 'Mad World',
      artist: 'Tears for Fears',
      genre: 'New Wave',
      key: 'Fm',
      bpm: 88,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'All around me are familiar faces', chords: { create: [{ chord: 'Fm', beatPosition: 0.0 }, { chord: 'Ab', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Worn out places, worn out faces', chords: { create: [{ chord: 'Eb', beatPosition: 0.0 }, { chord: 'Bb', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Bright and early for the daily races', chords: { create: [{ chord: 'Fm', beatPosition: 0.0 }, { chord: 'Ab', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: "And I find it kind of funny, I find it kind of sad", chords: { create: [{ chord: 'Ab', beatPosition: 0.0 }, { chord: 'Eb', beatPosition: 0.5 }] } },
                { order: 2, lyricText: 'The dreams in which I\'m dying are the best I\'ve ever had', chords: { create: [{ chord: 'Bb', beatPosition: 0.0 }, { chord: 'Fm', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'It\'s a mad world', chords: { create: [{ chord: 'Fm', beatPosition: 0.0 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-fast-car' },
    update: {},
    create: {
      id: 'song-fast-car',
      title: 'Fast Car',
      artist: 'Tracy Chapman',
      genre: 'Folk',
      key: 'C',
      bpm: 100,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'You got a fast car', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.6 }] } },
                { order: 2, lyricText: 'I want a ticket to anywhere', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Maybe we make a deal', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.6 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'You got a fast car', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'I got a plan to get us out of here', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'I been working at the convenience store', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-budapest' },
    update: {},
    create: {
      id: 'song-budapest',
      title: 'Budapest',
      artist: 'George Ezra',
      genre: 'Indie',
      key: 'C',
      bpm: 102,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'My house in Budapest, my my hidden treasure chest', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Golden grand piano, my beautiful Castillo', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'You, ooh, I\'d leave it all', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.6 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'Give me one good reason why I should never make a change', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Baby if you hold me then all of this will go away', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-shape-of-you' },
    update: {},
    create: {
      id: 'song-shape-of-you',
      title: 'Shape of You',
      artist: 'Ed Sheeran',
      genre: 'Pop',
      key: 'C#m',
      bpm: 96,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'The club isn\'t the best place to find a lover', chords: { create: [{ chord: 'C#m', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'So the bar is where I go', chords: { create: [{ chord: 'B', beatPosition: 0.0 }, { chord: 'E', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Me and my friends at the table doing shots', chords: { create: [{ chord: 'C#m', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'I\'m in love with the shape of you', chords: { create: [{ chord: 'C#m', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'We push and pull like a magnet do', chords: { create: [{ chord: 'B', beatPosition: 0.0 }, { chord: 'E', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Although my heart is falling too', chords: { create: [{ chord: 'C#m', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-africa' },
    update: {},
    create: {
      id: 'song-africa',
      title: 'Africa',
      artist: 'Toto',
      genre: 'Pop',
      key: 'F#m',
      bpm: 93,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'I hear the drums echoing tonight', chords: { create: [{ chord: 'F#m', beatPosition: 0.0 }, { chord: 'E', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'She hears only whispers of some quiet conversation', chords: { create: [{ chord: 'A', beatPosition: 0.0 }, { chord: 'E', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'She\'s coming in, twelve-thirty flight', chords: { create: [{ chord: 'F#m', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'I stopped an old man along the way', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Hoping to find some long forgotten words or ancient melodies', chords: { create: [{ chord: 'Bm', beatPosition: 0.0 }, { chord: 'A', beatPosition: 0.5 }] } },
                { order: 3, lyricText: 'Hurry boy, it\'s waiting there for you', chords: { create: [{ chord: 'D', beatPosition: 0.0 }, { chord: 'E', beatPosition: 0.6 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-zombie' },
    update: {},
    create: {
      id: 'song-zombie',
      title: 'Zombie',
      artist: 'The Cranberries',
      genre: 'Alternative',
      key: 'Em',
      bpm: 120,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'Another head hangs lowly', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }, { chord: 'Cmaj7', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Child is slowly taken', chords: { create: [{ chord: 'G6', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'And the violence caused such silence', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }, { chord: 'Cmaj7', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'In your head, in your head, zombie', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }, { chord: 'Cmaj7', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'What\'s in your head, in your head', chords: { create: [{ chord: 'G6', beatPosition: 0.0 }, { chord: 'D', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Zombie, zombie, zombie', chords: { create: [{ chord: 'Em', beatPosition: 0.0 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-hallelujah' },
    update: {},
    create: {
      id: 'song-hallelujah',
      title: 'Hallelujah',
      artist: 'Leonard Cohen',
      genre: 'Folk',
      key: 'C',
      bpm: 66,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'I heard there was a secret chord', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'Am', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'That David played and it pleased the Lord', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'Am', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'But you don\'t really care for music, do you', chords: { create: [{ chord: 'F', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'Hallelujah, Hallelujah', chords: { create: [{ chord: 'F', beatPosition: 0.0 }, { chord: 'Am', beatPosition: 0.5 }] } },
                { order: 2, lyricText: 'Hallelujah, Hallelujah', chords: { create: [{ chord: 'C', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.song.upsert({
    where: { id: 'song-mr-jones' },
    update: {},
    create: {
      id: 'song-mr-jones',
      title: 'Mr. Jones',
      artist: 'Counting Crows',
      genre: 'Alternative',
      key: 'Am',
      bpm: 128,
      sections: {
        create: [
          {
            name: 'Verse 1',
            order: 1,
            lines: {
              create: [
                { order: 1, lyricText: 'I was down at the New Amsterdam', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Staring at this yellow-haired girl', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Dm', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'Mr. Jones strikes up a conversation', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
              ],
            },
          },
          {
            name: 'Chorus',
            order: 2,
            lines: {
              create: [
                { order: 1, lyricText: 'Mr. Jones and me tell each other fairy tales', chords: { create: [{ chord: 'F', beatPosition: 0.0 }, { chord: 'G', beatPosition: 0.55 }] } },
                { order: 2, lyricText: 'Stare at the beautiful women', chords: { create: [{ chord: 'Am', beatPosition: 0.0 }, { chord: 'F', beatPosition: 0.55 }] } },
                { order: 3, lyricText: 'When everybody loves you, you can never be lonely', chords: { create: [{ chord: 'G', beatPosition: 0.0 }, { chord: 'Am', beatPosition: 0.6 }] } },
              ],
            },
          },
        ],
      },
    },
  });

  // Rooms
  const studioA = await prisma.room.upsert({
    where: { id: 'room-studio-a' },
    update: {},
    create: { id: 'room-studio-a', name: 'Studio A', capacity: 5 },
  });

  const rehearsalB = await prisma.room.upsert({
    where: { id: 'room-rehearsal-b' },
    update: {},
    create: { id: 'room-rehearsal-b', name: 'Rehearsal Room B', capacity: 8 },
  });

  // Users
  const hash = await bcrypt.hash('password123', 12);

  const alice = await prisma.user.upsert({
    where: { email: 'alice@jamsync.com' },
    update: {},
    create: {
      email: 'alice@jamsync.com',
      passwordHash: hash,
      name: 'Alice Chen',
      bio: 'Guitar enthusiast and Rock lover. Available most evenings!',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      instruments: {
        create: [{ instrumentId: guitar.id, level: SkillLevel.ADVANCED }],
      },
      songWishlist: {
        create: [{ songId: wonderwall.id }, { songId: hotelCalifornia.id }],
      },
      availability: {
        create: [
          { dayOfWeek: 5, timeSlotStart: '18:00', timeSlotEnd: '21:00', frequency: Frequency.WEEKLY },
          { dayOfWeek: 6, timeSlotStart: '14:00', timeSlotEnd: '18:00', frequency: Frequency.WEEKLY },
        ],
      },
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@jamsync.com' },
    update: {},
    create: {
      email: 'bob@jamsync.com',
      passwordHash: hash,
      name: 'Bob Martinez',
      bio: 'Drummer with 10 years experience. Love all genres!',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      instruments: {
        create: [
          { instrumentId: drums.id, level: SkillLevel.PRO },
          { instrumentId: bass.id, level: SkillLevel.INTERMEDIATE },
        ],
      },
      songWishlist: {
        create: [{ songId: hotelCalifornia.id }, { songId: letHerGo.id }],
      },
      availability: {
        create: [
          { dayOfWeek: 5, timeSlotStart: '18:00', timeSlotEnd: '21:00', frequency: Frequency.WEEKLY },
          { dayOfWeek: 0, timeSlotStart: '10:00', timeSlotEnd: '14:00', frequency: Frequency.BIWEEKLY },
        ],
      },
    },
  });

  const carol = await prisma.user.upsert({
    where: { email: 'carol@jamsync.com' },
    update: {},
    create: {
      email: 'carol@jamsync.com',
      passwordHash: hash,
      name: 'Carol Williams',
      bio: 'Vocalist and pianist. Looking for a band to join!',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol',
      instruments: {
        create: [
          { instrumentId: vocals.id, level: SkillLevel.ADVANCED },
          { instrumentId: piano.id, level: SkillLevel.INTERMEDIATE },
        ],
      },
      songWishlist: {
        create: [{ songId: wonderwall.id }, { songId: letHerGo.id }],
      },
      availability: {
        create: [
          { dayOfWeek: 3, timeSlotStart: '19:00', timeSlotEnd: '22:00', frequency: Frequency.WEEKLY },
          { dayOfWeek: 6, timeSlotStart: '14:00', timeSlotEnd: '18:00', frequency: Frequency.WEEKLY },
        ],
      },
    },
  });

  const dave = await prisma.user.upsert({
    where: { email: 'dave@jamsync.com' },
    update: {},
    create: {
      email: 'dave@jamsync.com',
      passwordHash: hash,
      name: 'Dave Park',
      bio: 'Bass player. Into Jazz and Blues mostly.',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=dave',
      instruments: {
        create: [{ instrumentId: bass.id, level: SkillLevel.ADVANCED }],
      },
      songWishlist: {
        create: [{ songId: wonderwall.id }, { songId: hotelCalifornia.id }],
      },
      availability: {
        create: [
          { dayOfWeek: 5, timeSlotStart: '18:00', timeSlotEnd: '21:00', frequency: Frequency.WEEKLY },
          { dayOfWeek: 1, timeSlotStart: '20:00', timeSlotEnd: '22:00', frequency: Frequency.BIWEEKLY },
        ],
      },
    },
  });

  // Sessions
  const now = new Date();
  const session1Start = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  session1Start.setHours(18, 0, 0, 0);
  const session1End = new Date(session1Start.getTime() + 2 * 60 * 60 * 1000);

  await prisma.session.upsert({
    where: { id: 'session-001' },
    update: {},
    create: {
      id: 'session-001',
      roomId: studioA.id,
      title: 'Friday Rock Night',
      startTime: session1Start,
      endTime: session1End,
      status: SessionStatus.PLANNED,
      members: {
        create: [
          { userId: alice.id, instrumentId: guitar.id },
          { userId: bob.id, instrumentId: drums.id },
        ],
      },
      songs: {
        create: [
          { songId: wonderwall.id, order: 1 },
          { songId: hotelCalifornia.id, order: 2 },
        ],
      },
    },
  });

  const session2Start = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  session2Start.setHours(14, 0, 0, 0);
  const session2End = new Date(session2Start.getTime() + 3 * 60 * 60 * 1000);

  await prisma.session.upsert({
    where: { id: 'session-002' },
    update: {},
    create: {
      id: 'session-002',
      roomId: rehearsalB.id,
      title: 'Acoustic Sunday',
      startTime: session2Start,
      endTime: session2End,
      status: SessionStatus.PLANNED,
      members: {
        create: [
          { userId: carol.id, instrumentId: vocals.id },
          { userId: dave.id, instrumentId: bass.id },
        ],
      },
      songs: {
        create: [
          { songId: letHerGo.id, order: 1 },
        ],
      },
    },
  });

  // Matches
  await prisma.match.upsert({
    where: { id: 'match-alice-bob' },
    update: {},
    create: {
      id: 'match-alice-bob',
      userAId: alice.id,
      userBId: bob.id,
      score: 88,
      reasons: ['Both love Hotel California', 'Available Fridays', 'Guitar + Drums'],
    },
  });

  await prisma.match.upsert({
    where: { id: 'match-alice-carol' },
    update: {},
    create: {
      id: 'match-alice-carol',
      userAId: alice.id,
      userBId: carol.id,
      score: 72,
      reasons: ['Both love Wonderwall', 'Available Saturdays', 'Guitar + Vocals'],
    },
  });

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
