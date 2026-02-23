import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { RefreshCw, Music2, Calendar } from 'lucide-react';
import { Match } from '../types';
import { matchesService } from '../services/matches.service';
import { Avatar } from '../components/ui/Avatar';
import { Badge, SkillBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ListSkeleton } from '../components/ui/Skeleton';
import { useToast } from '../hooks/useToast';
import { Card } from '../components/ui/Card';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Circular progress ring for compatibility score
const ScoreRing = ({ score }: { score: number }) => {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 75 ? '#A855F7' : score >= 50 ? '#60A5FA' : '#F59E0B';

  return (
    <svg width="80" height="80" className="flex-shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform="rotate(-90 40 40)"
        style={{ filter: `drop-shadow(0 0 8px ${color})` }}
      />
      <text x="40" y="40" textAnchor="middle" dominantBaseline="central" fill="white" fontSize="14" fontWeight="700">
        {Math.round(score)}
      </text>
      <text x="40" y="54" textAnchor="middle" dominantBaseline="central" fill="rgba(255,255,255,0.4)" fontSize="8">
        match
      </text>
    </svg>
  );
};

// Swipeable match card
const MatchCard = ({ match, onDismiss }: { match: Match; onDismiss: () => void }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [0, 100], [0, 1]);
  const nopeOpacity = useTransform(x, [-100, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      onDismiss();
    }
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: 'grabbing' }}
      className="absolute inset-0 cursor-grab"
    >
      <div className="bg-surface-800 rounded-3xl border border-white/10 shadow-2xl overflow-hidden h-full">
        {/* LIKE / NOPE indicators */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-6 left-6 z-10 border-4 border-green-400 text-green-400 px-3 py-1 rounded-xl font-black text-xl rotate-[-15deg]">
          JAM IT
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-6 right-6 z-10 border-4 border-red-400 text-red-400 px-3 py-1 rounded-xl font-black text-xl rotate-[15deg]">
          SKIP
        </motion.div>

        {/* Avatar header */}
        <div className="relative h-48 bg-gradient-to-br from-accent-purple/30 via-surface-700 to-accent-pink/20 flex items-center justify-center">
          <Avatar src={match.user.avatarUrl} name={match.user.name} size="xl" />
          <div className="absolute bottom-4 right-4">
            <ScoreRing score={match.score} />
          </div>
        </div>

        {/* Info */}
        <div className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(100% - 12rem)' }}>
          <div>
            <h2 className="text-2xl font-bold text-white">{match.user.name}</h2>
            {match.user.bio && <p className="text-white/50 text-sm mt-1 line-clamp-2">{match.user.bio}</p>}
          </div>

          {/* Instruments */}
          {match.user.instruments.length > 0 && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Instruments</p>
              <div className="flex flex-wrap gap-2">
                {match.user.instruments.map((ui) => (
                  <div key={ui.id} className="flex items-center gap-1.5 bg-surface-700 rounded-full px-3 py-1.5">
                    <span>{ui.instrument.icon}</span>
                    <span className="text-sm text-white font-medium">{ui.instrument.name}</span>
                    <SkillBadge level={ui.level} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Songs */}
          {match.user.songWishlist.length > 0 && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Music2 size={12} /> Wishlist
              </p>
              <div className="flex flex-wrap gap-2">
                {match.user.songWishlist.slice(0, 3).map((us) => (
                  <Badge key={us.songId} variant="blue" size="sm">
                    {us.song.title}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {match.user.availability.length > 0 && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Calendar size={12} /> Available
              </p>
              <div className="flex gap-1 flex-wrap">
                {[...new Set(match.user.availability.map((a) => a.dayOfWeek))].map((d) => (
                  <Badge key={d} variant="gold" size="sm">{DAYS[d]}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Reasons */}
          {match.reasons.length > 0 && (
            <div className="bg-surface-700/50 rounded-xl p-3 space-y-1">
              {match.reasons.map((r, i) => (
                <p key={i} className="text-sm text-white/70 flex items-center gap-2">
                  <span className="text-accent-gold">✓</span> {r}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const MatchPage = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const toast = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const data = await matchesService.getMatches();
      setMatches(data);
    } catch {
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleCompute = async () => {
    setComputing(true);
    try {
      await matchesService.computeMatches();
      await load();
      setDismissed(new Set());
      toast.success('Matches refreshed!');
    } catch {
      toast.error('Failed to compute matches');
    } finally {
      setComputing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visibleMatches = matches.filter((m) => !dismissed.has(m.id));
  const currentMatch = visibleMatches[visibleMatches.length - 1];

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Find Musicians</h1>
          <p className="text-white/40 text-sm mt-0.5">Swipe to connect with compatible jammers</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={14} />}
          loading={computing}
          onClick={handleCompute}
        >
          Refresh
        </Button>
      </div>

      {loading ? (
        <ListSkeleton count={1} />
      ) : visibleMatches.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
          <div className="text-6xl mb-4">🎵</div>
          <h2 className="text-xl font-bold text-white mb-2">You've seen everyone!</h2>
          <p className="text-white/40 mb-6">Refresh to find new matches</p>
          <Button onClick={handleCompute} loading={computing} icon={<RefreshCw size={14} />}>
            Find More
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Card stack */}
          <div className="relative" style={{ height: '520px' }}>
            <AnimatePresence>
              {visibleMatches.slice(-3).map((match, idx, arr) => (
                <motion.div
                  key={match.id}
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{
                    scale: 1 - (arr.length - 1 - idx) * 0.05,
                    y: (arr.length - 1 - idx) * -8,
                    opacity: 1,
                    zIndex: idx,
                  }}
                  exit={{ opacity: 0, x: 300, rotate: 20, transition: { duration: 0.3 } }}
                  className="absolute inset-0"
                >
                  {idx === arr.length - 1 ? (
                    <MatchCard
                      match={match}
                      onDismiss={() => setDismissed((prev) => new Set([...prev, match.id]))}
                    />
                  ) : (
                    <div className="bg-surface-800 rounded-3xl border border-white/10 h-full" />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-6">
            <button
              onClick={() => currentMatch && setDismissed((p) => new Set([...p, currentMatch.id]))}
              className="w-14 h-14 rounded-full bg-surface-700 border border-white/10 flex items-center justify-center text-2xl shadow-lg hover:bg-red-500/20 hover:border-red-500/30 transition-all"
              aria-label="Skip"
            >
              ✕
            </button>
            <button
              onClick={() => {
                if (currentMatch) {
                  toast.success(`Matched with ${currentMatch.user.name}!`);
                  setDismissed((p) => new Set([...p, currentMatch.id]));
                }
              }}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-accent-purple-light to-accent-pink flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30 hover:scale-105 transition-all"
              aria-label="Jam with this person"
            >
              🎸
            </button>
          </div>

          {/* Remaining count */}
          <p className="text-center text-white/30 text-sm">
            {visibleMatches.length} musician{visibleMatches.length !== 1 ? 's' : ''} left
          </p>
        </div>
      )}

      {/* All matches list */}
      {!loading && matches.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">All Matches</h2>
          <div className="space-y-2">
            {matches.map((match) => (
              <Card key={match.id} className="p-4 flex items-center gap-4">
                <Avatar src={match.user.avatarUrl} name={match.user.name} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white">{match.user.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.user.instruments.map((ui) => (
                      <Badge key={ui.id} variant="purple" size="sm">
                        {ui.instrument.icon} {ui.instrument.name}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <ScoreRing score={match.score} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
