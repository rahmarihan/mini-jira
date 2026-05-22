// frontend/src/components/tasks/ManagerTeamFilter.tsx
'use client';

interface Team { teamId: string; name?: string; }

interface Props {
  teams: Team[];
  selectedTeamId: string;
  onChange: (teamId: string) => void;
}

export default function ManagerTeamFilter({ teams, selectedTeamId, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-600">Filter by Team:</label>
      <select
        value={selectedTeamId}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Teams</option>
        {teams.map((team) => (
          <option key={team.teamId} value={team.teamId}>
            {team.name || team.teamId}
          </option>
        ))}
      </select>
    </div>
  );
}
