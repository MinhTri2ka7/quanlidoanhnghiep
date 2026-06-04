function IpInfoCard({ title, ipInfo }) {
  if (!ipInfo) {
    return null;
  }

  return (
    <div className="mt-4 rounded-xl border border-darkBorder bg-darkBg p-4">
      <div className="flex items-center gap-2 mb-3">
        <NetworkIcon />
        <h4 className="text-sm font-semibold text-darkText">{title}</h4>
      </div>

      <dl className="space-y-2 text-sm">
        <IpInfoRow label="IP nội bộ" value={ipInfo.localIpAddress} />
        <IpInfoRow label="IP công cộng" value={ipInfo.publicIpAddress} />
        <IpInfoRow
          label="Thời điểm"
          value={formatTimestamp(ipInfo.capturedAt)}
        />
      </dl>
    </div>
  );
}

function IpInfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-darkTextGray">{label}</dt>
      <dd className="font-mono font-medium text-darkText">{value}</dd>
    </div>
  );
}

function formatTimestamp(isoString) {
  if (!isoString) {
    return "-";
  }

  const date = new Date(isoString);
  return date.toLocaleString("vi-VN");
}

function NetworkIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primaryBlue"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default IpInfoCard;
