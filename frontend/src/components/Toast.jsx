function Toast({ message, variant = "success" }) {
  if (!message) {
    return null;
  }

  const variantStyleMap = {
    success: "bg-successGreen/10 border-successGreen/20 text-successGreen",
    error: "bg-dangerRed/10 border-dangerRed/20 text-dangerRed",
    info: "bg-primaryBlue/10 border-primaryBlue/20 text-primaryBlue"
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${variantStyleMap[variant]}`}
      role="alert"
    >
      {message}
    </div>
  );
}

export default Toast;
