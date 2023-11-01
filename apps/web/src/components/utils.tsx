export function RowItem({ label, value }: { label: string; value: string | number | JSX.Element }) {
  return (
    <>
      <span className="text-gray-400 border-b dark:border-b-gray-700 border-b-gray-100 py-2">
        {label}
      </span>
      <div className="border-b dark:border-b-gray-700 border-b-gray-100 py-2">{value}</div>
    </>
  );
}
