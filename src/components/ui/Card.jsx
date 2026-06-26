/* Card atom — surface container. `hover` adds the lift effect (.card-hover). */
export function Card({ hover = false, className = "", children, ...rest }) {
  const cls = `card ${hover ? "card-hover" : ""} ${className}`.trim();
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}

export default Card;
