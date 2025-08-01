import { useTheme } from '../hooks/useTheme';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'clean' as const, name: '简洁' },
    { id: 'sunrise' as const, name: '日出' },
    { id: 'green-mountain' as const, name: '青山' },
    { id: 'blue-water' as const, name: '绿水' },
    { id: 'night' as const, name: '夜晚' },
  ];

  return (
    <div className="flex items-center gap-2">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as any)}
        className="px-3 py-1 text-sm border border-border rounded-md bg-background"
      >
        {themes.map(({ id, name }) => (
          <option key={id} value={id}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}