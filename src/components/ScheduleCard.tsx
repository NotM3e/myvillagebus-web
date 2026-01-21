import { Schedule } from '@/types/schedule';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbDownOutlinedIcon from '@mui/icons-material/ThumbDownOutlined';

interface ScheduleCardProps {
  schedule: Schedule;
}

export default function ScheduleCard({ schedule }: ScheduleCardProps) {
  return (
    <div className="md-card md-elevation-1 p-4 mb-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-[var(--md-sys-color-primary-container)] flex items-center justify-center">
          <DirectionsBusIcon 
            sx={{ fontSize: 24, color: 'var(--md-sys-color-on-primary-container)' }} 
          />
        </div>
        <div>
          <p className="md-title-medium">{schedule.carrier}</p>
          <p className="md-body-small text-[var(--md-sys-color-on-surface-variant)]">
            Linia {schedule.line}
          </p>
        </div>
      </div>

      {/* Direction */}
      <p className="md-body-large mb-2">{schedule.direction}</p>

      {/* Days */}
      <div className="flex gap-1 mb-4">
        {schedule.days.map((day) => (
          <span 
            key={day}
            className="px-2 py-1 text-xs rounded-full bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Stops */}
      <div className="space-y-2 mb-4">
        {schedule.stops.map((stop, index) => (
          <div key={index} className="flex items-center gap-3">
            <AccessTimeIcon 
              sx={{ fontSize: 16, color: 'var(--md-sys-color-outline)' }} 
            />
            <span className="md-body-medium font-medium w-12">{stop.time}</span>
            <span className="md-body-medium text-[var(--md-sys-color-on-surface-variant)]">
              {stop.name}
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
        <button className="md-text-button flex items-center gap-1">
          <ThumbUpOutlinedIcon sx={{ fontSize: 18 }} />
          <span>12</span>
        </button>
        <button className="md-text-button flex items-center gap-1">
          <ThumbDownOutlinedIcon sx={{ fontSize: 18 }} />
          <span>2</span>
        </button>
      </div>
    </div>
  );
}