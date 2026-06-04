function Divider({ label }) {
  return (
    <div className="flex items-center gap-4 my-2">
      <div className="flex-1 h-px bg-borderSoft" />
      <span className="text-sm text-textGray">{label}</span>
      <div className="flex-1 h-px bg-borderSoft" />
    </div>
  );
}

export default Divider;
