// src/components/Button.jsx
export default function Button({ children, variant = "primary", ...rest }) {
  const className =
    variant === "secondary" ? "btn-secondary" : "btn-primary";

  return (
    <button className={className} {...rest}>
      {children}
    </button>
  );
}
