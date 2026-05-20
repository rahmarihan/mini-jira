'use client';

import type { Team } from '@/src/lib/teams';

interface TeamSelectorProps {
  teams: Team[];
  selectedTeamId: string;
  onChange: (teamId: string) => void;
  id?: string;
  className?: string;
}

/** Manager team filter — teams supplied by M1/M2 API, not hardcoded in M5 */
export default function TeamSelector({
  teams,
  selectedTeamId,
  onChange,
  id = 'team-select',
  className,
}: TeamSelectorProps) {
  return (
    <select
      id={id}
      value={selectedTeamId}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <option value="">All Teams</option>
      {teams.map((team) => (
        <option key={team.teamId} value={team.teamId}>
          {team.name}
        </option>
      ))}
    </select>
  );
}
