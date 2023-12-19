export function RowItem({
  label,
  value,
  className,
}: { label: string; className?: string; value: string | number | JSX.Element }) {
  return (
    <>
      <span
        className={`text-gray-400 border-b dark:border-b-gray-700 border-b-gray-100 py-2 ${className}`}
      >
        {label}
      </span>
      <div className="border-b dark:border-b-gray-700 border-b-gray-100 py-2">{value}</div>
    </>
  );
}
