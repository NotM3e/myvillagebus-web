'use client';

import { useState, useEffect } from 'react';
import type { OfflineScheduleWithDetails } from '@/lib/db/hooks';
import { getTodayHolidayInfo } from '@/lib/holidays';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

interface OfflineScheduleCardProps {
  schedule: OfflineScheduleWithDetails;
  displayTime?: string | null;
}

type VoteState = 'none' | 'up' | 'down';

export default function OfflineScheduleCard({ schedule, displayTime }: OfflineScheduleCardProps) {
  const [user, setUser] = useState<User | null>(null);
  const [voteState, setVoteState] = useState<VoteState>('none');
  const [localScore, setLocalScore] = useState(schedule.netScore);
  
  // Check auth status
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  // Holiday warning
  const holidayInfo = getTodayHolidayInfo();
  const showHolidayWarning = schedule.excludesHolidays && holidayInfo.isHoliday;

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    return time.slice(0, 5);
  };

  const handleVote = (vote: 'up' | 'down') => {
    if (!user) {
      // TODO: Show login prompt
      alert('Zaloguj się, aby głosować');
      return;
    }

    if (voteState === vote) {
      // Remove vote
      setVoteState('none');
      setLocalScore(schedule.netScore);
    } else {
      // Change vote
      const scoreDiff = voteState === 'none' ? 1 : 2;
      setVoteState(vote);
      setLocalScore(prev => vote === 'up' ? prev + scoreDiff : prev - scoreDiff);
    }

    // TODO: Sync vote to Supabase
  };

  const handleReport = () => {
    if (!user) {
      alert('Zaloguj się, aby zgłosić problem');
      return;
    }
    // TODO: Open report modal
    alert('Funkcja zgłaszania wkrótce');
  };

  // Status styling
  const getStatusStyle = () => {
    if (schedule.status === 'pending') {
      return {
        borderColor: 'var(--md-sys-color-tertiary)',
        badgeBg: 'var(--md-sys-color-tertiary-container)',
        badgeText: 'var(--md-sys-color-on-tertiary-container)',
        label: 'Oczekuje',
        icon: <PendingIcon sx={{ fontSize: 14 }} />,
      };
    }
    
    if (schedule.isVerified) {
      return {
        borderColor: 'var(--md-sys-color-primary)',
        badgeBg: 'var(--md-sys-color-primary-container)',
        badgeText: 'var(--md-sys-color-on-primary-container)',
        label: 'Zweryfikowany',
        icon: <VerifiedIcon sx={{ fontSize: 14 }} />,
      };
    }
    
    // Active but unverified
    return {
      borderColor: 'var(--md-sys-color-secondary)',
      badgeBg: 'var(--md-sys-color-secondary-container)',
      badgeText: 'var(--md-sys-color-on-secondary-container)',
      label: 'Społecznościowy',
      icon: <PersonOutlineIcon sx={{ fontSize: 14 }} />,
    };
  };

  const status = getStatusStyle();

  return (
    <div 
      className="md-card md-elevation-1 p-4 mb-4 border-l-4"
      style={{ borderLeftColor: status.borderColor }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
          <DirectionsBusIcon 
            sx={{ fontSize: 24, color: 'var(--md-sys-color-on-primary-container)' }} 
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="md-title-medium">{schedule.carrierName}</p>
            {schedule.carrierVerified && (
              <VerifiedIcon 
                sx={{ fontSize: 16, color: 'var(--md-sys-color-primary)' }} 
              />
            )}
          </div>
          <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
            Linia {schedule.lineNumber}
          </p>
        </div>
        
        {/* Departure time */}
        <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--md-sys-color-primary-container)]">
          <AccessTimeIcon 
            sx={{ fontSize: 18, color: 'var(--md-sys-color-on-primary-container)' }} 
          />
          <span className="md-title-medium text-[var(--md-sys-color-on-primary-container)]">
            {displayTime ?? formatTime(schedule.firstDeparture)}
          </span>
        </div>
      </div>

      {/* Direction */}
      <p className="md-body-large mt-3 mb-2">{schedule.direction}</p>

      {/* Status badge */}
      <div className="flex items-center gap-2 mb-2">
        <span 
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
          style={{ 
            backgroundColor: status.badgeBg, 
            color: status.badgeText 
          }}
        >
          {status.icon}
          {status.label}
        </span>
      </div>

      {/* Holiday warning */}
      {showHolidayWarning && (
        <div className="flex items-center gap-2 p-2 mb-2 rounded-lg bg-[var(--md-sys-color-error-container)]">
          <WarningAmberIcon 
            sx={{ fontSize: 18, color: 'var(--md-sys-color-on-error-container)' }} 
          />
          <p className="md-body-small text-[var(--md-sys-color-on-error-container)]">
            Prawdopodobnie nie kursuje - {holidayInfo.name}
          </p>
        </div>
      )}

      {/* Operation note */}
      {schedule.lineOperationNote && (
        <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)] mb-2 italic">
          {schedule.lineOperationNote}
        </p>
      )}

      {/* Days */}
      <div className="flex flex-wrap gap-1 mb-3">
        {schedule.days.map((day) => (
          <span 
            key={day}
            className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
          >
            {day}
          </span>
        ))}
        {schedule.excludesHolidays && (
          <span className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)]">
            bez świąt
          </span>
        )}
      </div>
      
      {/* Footer: Score + Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
        {/* Score */}
        <div className="flex items-center gap-1">
          <span className={`md-label-large ${
            localScore > 0 
              ? 'text-[var(--md-sys-color-primary)]' 
              : localScore < 0 
                ? 'text-[var(--md-sys-color-error)]' 
                : 'text-[var(--md-sys-color-on-surface-variant)]'
          }`}>
            {localScore > 0 ? '+' : ''}{localScore}
          </span>
          <span className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
            pkt
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Upvote */}
          <button
            onClick={() => handleVote('up')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
            title="Aktualny"
          >
            {voteState === 'up' ? (
              <ThumbUpIcon sx={{ fontSize: 20, color: 'var(--md-sys-color-primary)' }} />
            ) : (
              <ThumbUpOutlinedIcon sx={{ fontSize: 20, color: 'var(--md-sys-color-on-surface-variant)' }} />
            )}
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote('down')}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
            title="Nieaktualny"
          >
            {voteState === 'down' ? (
              <ThumbDownIcon sx={{ fontSize: 20, color: 'var(--md-sys-color-error)' }} />
            ) : (
              <ThumbDownOutlinedIcon sx={{ fontSize: 20, color: 'var(--md-sys-color-on-surface-variant)' }} />
            )}
          </button>

          {/* Report */}
          <button
            onClick={handleReport}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[var(--md-sys-color-surface-variant)] transition-colors"
            title="Zgłoś problem"
          >
            <FlagOutlinedIcon sx={{ fontSize: 20, color: 'var(--md-sys-color-on-surface-variant)' }} />
          </button>
        </div>
      </div>
    </div>
  );
}