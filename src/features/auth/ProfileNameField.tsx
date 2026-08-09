type ProfileNameFieldProps = {
  hadNameOnEntry: boolean
  value: string
  onChange: (value: string) => void
}

export function ProfileNameField({
  hadNameOnEntry,
  value,
  onChange,
}: ProfileNameFieldProps) {
  if (hadNameOnEntry) {
    return <p className="mt-4 text-base font-bold text-on-surface">{value}</p>
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      maxLength={80}
      autoComplete="name"
      placeholder="Введите своё имя"
      className="mt-4 w-full max-w-[240px] h-11 px-4 bg-surface-container-lowest border border-outline-variant rounded-full text-center text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:ring-4 focus:ring-primary/5 focus:border-primary transition-colors outline-none"
    />
  )
}
