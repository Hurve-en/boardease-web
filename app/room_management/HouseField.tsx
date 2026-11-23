export default function HouseField({houses, value, className}: {
  houses: {name: string}[];
  value?: string | null;
  className: string;
}) {
  return (
    <label className="mt-5 block text-[13px] font-semibold">
      Boarding-house name
      <input name="boardingHouseName" list="boarding-houses" defaultValue={value ?? ""}
        required maxLength={120} className={className} />
      <datalist id="boarding-houses">
        {houses.map(({name}) => <option key={name} value={name} />)}
      </datalist>
    </label>
  );
}
