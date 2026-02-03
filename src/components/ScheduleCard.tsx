'use client';

import { useState } from 'react';
import type { ActiveScheduleView } from '@/types/database';
import { voteOnSchedule } from '@/lib/supabase/queries';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import VerifiedIcon from '@mui/icons-material/Verified';

interface ScheduleCardProps {
  schedule: ActiveScheduleView;
}

export default function ScheduleCard({ schedule }: ScheduleCardProps) {
  const [userVote, setUserVote] = useState<'positive' | 'negative' | null>(null);
  const [score, setScore] = useState(schedule.net_score);
  const [voting, setVoting] = useState(false);

  const handleVote = async (voteType: 'positive' | 'negative') => {
    if (voting) return;
    setVoting(true);

    // Optimistic update
    const previousVote = userVote;
    const previousScore = score;

    if (userVote === voteType) {
      // Remove vote
      setUserVote(null);
      setScore(score + (voteType === 'positive' ? -1 : 1));
    } else {
      // Change or add vote
      setUserVote(voteType);
      const scoreDelta = voteType === 'positive' ? 1 : -1;
      const previousDelta = previousVote === 'positive' ? -1 : previousVote === 'negative' ? 1 : 0;
      setScore(score + scoreDelta + previousDelta);
    }

    const result = await voteOnSchedule(schedule.id, voteType);
    
    if (!result.success) {
      // Rollback on error
      setUserVote(previousVote);
      setScore(previousScore);
      // TODO: show toast with error
    }

    setVoting(false);
  };

  return (
    <div className="md-card md-elevation-1 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
          <DirectionsBusIcon 
            sx={{ fontSize: 24, color: 'var(--md-sys-color-on-primary-container)' }} 
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="md-title-medium">{schedule.carrier_name}</p>
            {schedule.carrier_verified && (
              <VerifiedIcon 
                sx={{ fontSize: 16, color: 'var(--md-sys-color-primary)' }} 
              />
            )}
          </div>
          <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
            Linia {schedule.line_number}
          </p>
        </div>
      </div>

      {/* Direction */}
      <p className="md-body-large mb-2">{schedule.direction}</p>

      {/* Days */}
      <div className="flex flex-wrap gap-1 mb-4">
        {schedule.days.map((day) => (
          <span 
            key={day}
            className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
          >
            {day}
          </span>
        ))}
        {schedule.excludes_holidays && (
          <span className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
            bez świąt
          </span>
        )}
      </div>

      {/* Status badges */}
      <div className="flex gap-2 mb-4">
        {schedule.is_verified && (
          <span className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-tertiary-container)] text-[var(--md-sys-color-on-tertiary-container)]">
            Zweryfikowany
          </span>
        )}
        {schedule.is_incomplete && (
          <span className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
            Niekompletny
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
        <button 
          onClick={() => handleVote('positive')}
          disabled={voting}
          className="md-text-button flex items-center gap-1"
        >
          {userVote === 'positive' ? (
            <ThumbUpIcon sx={{ fontSize: 18, color: 'var(--md-sys-color-primary)' }} />
          ) : (
            <ThumbUpOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </button>
        
        <span className={`md-body-medium min-w-[2rem] text-center ${
          score > 0 ? 'text-[var(--md-sys-color-primary)]' : 
          score < 0 ? 'text-[var(--md-sys-color-error)]' : ''
        }`}>
          {score > 0 ? `+${score}` : score}
        </span>
        
        <button 
          onClick={() => handleVote('negative')}
          disabled={voting}
          className="md-text-button flex items-center gap-1"
        >
          {userVote === 'negative' ? (
            <ThumbDownIcon sx={{ fontSize: 18, color: 'var(--md-sys-color-error)' }} />
          ) : (
            <ThumbDownOutlinedIcon sx={{ fontSize: 18 }} />
          )}
        </button>
      </div>
    </div>
  );
}