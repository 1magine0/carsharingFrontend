import { forwardRef } from "react";

/* Input atom — applies the .input design class. Forwards ref + native props. */
export const Input = forwardRef(function Input({ className = "", ...rest }, ref) {
  return <input ref={ref} className={`input ${className}`.trim()} {...rest} />;
});

export default Input;
