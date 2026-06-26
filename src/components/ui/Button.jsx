/* Button atom — maps `variant` to the .btn-* classes from the design system. */

const VARIANT_CLASS = {
  primary: "btn-primary",
  ghost: "btn-ghost",
  subtle: "btn-subtle",
  danger: "btn-danger",
};

export function Button({
  variant = "primary",
  type = "button",
  className = "",
  children,
  ...rest
}) {
  const cls = `btn ${VARIANT_CLASS[variant] || VARIANT_CLASS.primary} ${className}`.trim();
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

export default Button;
