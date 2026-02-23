import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Plus, X, Music2, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { usersService } from '../services/users.service';
import { songsService } from '../services/songs.service';
import { Instrument, Song, SkillLevel, ItunesTrack } from '../types';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge, SkillBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { useToast } from '../hooks/useToast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQUENCIES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY'] as const;
const SKILL_LEVELS: SkillLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'PRO'];

export const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const [instruments, setInstruments] = useState(user?.instruments || []);
  const [allInstruments, setAllInstruments] = useState<Instrument[]>([]);
  const [addingInstrument, setAddingInstrument] = useState(false);
  const [newInstId, setNewInstId] = useState('');
  const [newInstLevel, setNewInstLevel] = useState<SkillLevel>('INTERMEDIATE');

  const [songs, setSongs] = useState(user?.songWishlist || []);
  const [songSearch, setSongSearch] = useState('');
  const [songResults, setSongResults] = useState<ItunesTrack[]>([]);
  const [searchingSongs, setSearchingSongs] = useState(false);
  const [addingSongId, setAddingSongId] = useState<number | null>(null);

  const [availability, setAvailability] = useState(
    user?.availability || []
  );

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
      setInstruments(user.instruments);
      setSongs(user.songWishlist);
      setAvailability(user.availability);
    }
  }, [user]);

  useEffect(() => {
    usersService.getInstruments().then(setAllInstruments).catch(() => {});
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const updated = await usersService.updateUser(user.id, { name, bio });
      updateUser({ ...user, ...updated });
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddInstrument = async () => {
    if (!user || !newInstId) return;
    try {
      await usersService.addInstrument(user.id, { instrumentId: newInstId, level: newInstLevel });
      const fresh = await usersService.getUser(user.id);
      setInstruments(fresh.instruments);
      updateUser({ ...user, instruments: fresh.instruments });
      setAddingInstrument(false);
      setNewInstId('');
      toast.success('Instrument added!');
    } catch {
      toast.error('Failed to add instrument');
    }
  };

  const handleRemoveInstrument = async (userInstrumentId: string) => {
    if (!user) return;
    try {
      await usersService.removeInstrument(user.id, userInstrumentId);
      const newList = instruments.filter((i) => i.id !== userInstrumentId);
      setInstruments(newList);
      updateUser({ ...user, instruments: newList });
      toast.success('Instrument removed');
    } catch {
      toast.error('Failed to remove instrument');
    }
  };

  const handleSongSearch = async (query: string) => {
    setSongSearch(query);
    if (!query.trim()) { setSongResults([]); return; }
    setSearchingSongs(true);
    try {
      const results = await songsService.searchItunes(query);
      setSongResults(results.filter((r) => !songs.find((ws) => ws.song.itunesTrackId === r.trackId)));
    } finally {
      setSearchingSongs(false);
    }
  };

  const handleAddSong = async (track: ItunesTrack) => {
    if (!user) return;
    setSongResults([]);
    setSongSearch('');
    setAddingSongId(track.trackId);
    try {
      const song = await songsService.findOrCreateFromItunes(track);
      await usersService.addToWishlist(user.id, song.id);
      const newWishlist = [...songs, { userId: user.id, songId: song.id, song }];
      setSongs(newWishlist);
      updateUser({ ...user, songWishlist: newWishlist });
      toast.success(`${song.title} added to wishlist!`);
    } catch {
      toast.error('Failed to add song');
    } finally {
      setAddingSongId(null);
    }
  };

  const handleRemoveSong = async (songId: string) => {
    if (!user) return;
    try {
      await usersService.removeFromWishlist(user.id, songId);
      const newWishlist = songs.filter((s) => s.songId !== songId);
      setSongs(newWishlist);
      updateUser({ ...user, songWishlist: newWishlist });
      toast.success('Song removed from wishlist');
    } catch {
      toast.error('Failed to remove song');
    }
  };

  const handleSaveAvailability = async () => {
    if (!user) return;
    try {
      await usersService.updateAvailability(user.id, availability.map(({ id, ...rest }) => rest));
      updateUser({ ...user, availability });
      toast.success('Availability saved!');
    } catch {
      toast.error('Failed to save availability');
    }
  };

  const toggleDaySlot = (day: number) => {
    const existing = availability.find((a) => a.dayOfWeek === day);
    if (existing) {
      setAvailability((prev) => prev.filter((a) => a.dayOfWeek !== day));
    } else {
      setAvailability((prev) => [
        ...prev,
        { id: `new-${day}`, dayOfWeek: day, timeSlotStart: '18:00', timeSlotEnd: '21:00', frequency: 'WEEKLY' },
      ]);
    }
  };

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  if (!user) return null;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">My Profile</h1>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

        {/* Avatar + Basic Info */}
        <motion.div variants={item}>
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <Avatar src={user.avatarUrl} name={user.name} size="xl" />
              <div className="flex-1 space-y-3">
                <Input
                  label="Display Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1.5">Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell other musicians about yourself..."
                    className="w-full bg-surface-600 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-purple-light resize-none"
                  />
                </div>
                <Button icon={<Save size={14} />} onClick={handleSaveProfile} loading={saving} size="sm">
                  Save Profile
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Instruments */}
        <motion.div variants={item}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Instruments</h2>
              <Button size="sm" variant="secondary" icon={<Plus size={12} />} onClick={() => setAddingInstrument(true)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {instruments.map((ui) => (
                <div key={ui.id} className="flex items-center gap-2 bg-surface-700 rounded-full px-3 py-1.5">
                  <span>{ui.instrument.icon}</span>
                  <span className="text-sm text-white font-medium">{ui.instrument.name}</span>
                  <SkillBadge level={ui.level} />
                  <button
                    onClick={() => handleRemoveInstrument(ui.id)}
                    className="text-white/30 hover:text-red-400 transition-colors ml-1"
                    aria-label={`Remove ${ui.instrument.name}`}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {instruments.length === 0 && (
                <p className="text-white/40 text-sm">No instruments added yet</p>
              )}
            </div>

            {addingInstrument && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-surface-700 rounded-xl space-y-3"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Instrument</label>
                    <select
                      className="w-full bg-surface-600 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-purple-light"
                      value={newInstId}
                      onChange={(e) => setNewInstId(e.target.value)}
                      aria-label="Select instrument"
                    >
                      <option value="">Select...</option>
                      {allInstruments.map((inst) => (
                        <option key={inst.id} value={inst.id}>{inst.icon} {inst.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/50 mb-1">Skill Level</label>
                    <select
                      className="w-full bg-surface-600 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-purple-light"
                      value={newInstLevel}
                      onChange={(e) => setNewInstLevel(e.target.value as SkillLevel)}
                      aria-label="Select skill level"
                    >
                      {SKILL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddInstrument} className="flex-1">Add</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingInstrument(false)}>Cancel</Button>
                </div>
              </motion.div>
            )}
          </Card>
        </motion.div>

        {/* Song Wishlist */}
        <motion.div variants={item}>
          <Card className="p-6">
            <h2 className="font-bold text-white mb-4">Song Wishlist</h2>

            {/* Search */}
            <div className="relative mb-4">
              <Input
                icon={<Search size={14} />}
                placeholder="Search iTunes for songs to add..."
                value={songSearch}
                onChange={(e) => handleSongSearch(e.target.value)}
              />
              {(searchingSongs || songResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-700 rounded-xl border border-white/10 overflow-hidden z-10 shadow-xl">
                  {searchingSongs ? (
                    <div className="px-4 py-3 text-sm text-white/40">Searching iTunes...</div>
                  ) : (
                    songResults.map((track) => (
                      <button
                        key={track.trackId}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-600 transition-colors text-left disabled:opacity-50"
                        disabled={addingSongId === track.trackId}
                        onClick={() => { handleAddSong(track); setSongSearch(''); setSongResults([]); }}
                      >
                        {track.artworkUrl100 ? (
                          <img
                            src={track.artworkUrl100}
                            alt={track.trackName}
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <Music2 size={14} className="text-accent-purple-light flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white font-medium truncate">{track.trackName}</p>
                          <p className="text-xs text-white/40 truncate">{track.artistName} · {track.primaryGenreName}</p>
                        </div>
                        {addingSongId === track.trackId && (
                          <span className="text-xs text-white/40">Adding...</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Wishlist cards */}
            <div className="flex gap-3 overflow-x-auto pb-2">
              {songs.length === 0 ? (
                <p className="text-white/40 text-sm">Your wishlist is empty. Search for songs above.</p>
              ) : (
                songs.map((us) => (
                  <div
                    key={us.songId}
                    className="flex-shrink-0 w-40 bg-surface-700 rounded-xl overflow-hidden relative group"
                  >
                    {us.song.artworkUrl ? (
                      <img
                        src={us.song.artworkUrl}
                        alt={us.song.title}
                        className="w-full h-28 object-cover"
                      />
                    ) : (
                      <div className="w-full h-28 bg-surface-600 flex items-center justify-center">
                        <Music2 size={28} className="text-accent-purple-light" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveSong(us.songId)}
                      className="absolute top-2 right-2 bg-black/60 rounded-full p-0.5 text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      aria-label={`Remove ${us.song.title}`}
                    >
                      <X size={12} />
                    </button>
                    <div className="p-3">
                      <p className="text-sm font-semibold text-white truncate">{us.song.title}</p>
                      <p className="text-xs text-white/40 truncate">{us.song.artist}</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {us.song.key && <Badge variant="gold" size="sm">{us.song.key}</Badge>}
                        {us.song.bpm > 0 && <Badge variant="gray" size="sm">{us.song.bpm} BPM</Badge>}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>

        {/* Availability */}
        <motion.div variants={item}>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-white">Availability</h2>
              <Button size="sm" icon={<Save size={12} />} onClick={handleSaveAvailability} variant="secondary">
                Save
              </Button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-4">
              {DAYS.map((day, idx) => {
                const slot = availability.find((a) => a.dayOfWeek === idx);
                const active = !!slot;
                return (
                  <button
                    key={day}
                    onClick={() => toggleDaySlot(idx)}
                    className={`
                      rounded-xl py-2.5 text-xs font-semibold transition-all
                      ${active
                        ? 'bg-accent-purple/30 text-accent-purple-light border border-accent-purple/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                        : 'bg-surface-700 text-white/40 border border-white/5 hover:border-white/20 hover:text-white/70'
                      }
                    `}
                    aria-pressed={active}
                    aria-label={`${day} availability`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>

            {/* Time slot editors for active days */}
            <div className="space-y-3">
              {availability.map((slot, idx) => (
                <div key={slot.dayOfWeek} className="flex flex-wrap items-center gap-2 bg-surface-700 rounded-xl px-4 py-3">
                  <span className="text-sm font-medium text-accent-purple-light w-10">
                    {DAYS[slot.dayOfWeek].slice(0, 3)}
                  </span>
                  <input
                    type="time"
                    value={slot.timeSlotStart}
                    onChange={(e) =>
                      setAvailability((prev) =>
                        prev.map((a, i) => (i === idx ? { ...a, timeSlotStart: e.target.value } : a))
                      )
                    }
                    className="bg-surface-600 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-purple-light"
                    aria-label="Start time"
                  />
                  <span className="text-white/30 text-xs">to</span>
                  <input
                    type="time"
                    value={slot.timeSlotEnd}
                    onChange={(e) =>
                      setAvailability((prev) =>
                        prev.map((a, i) => (i === idx ? { ...a, timeSlotEnd: e.target.value } : a))
                      )
                    }
                    className="bg-surface-600 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-purple-light"
                    aria-label="End time"
                  />
                  <select
                    value={slot.frequency}
                    onChange={(e) =>
                      setAvailability((prev) =>
                        prev.map((a, i) => (i === idx ? { ...a, frequency: e.target.value as any } : a))
                      )
                    }
                    className="ml-auto bg-surface-600 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-accent-purple-light"
                    aria-label="Frequency"
                  >
                    {FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
};
