import type React from "react";

type Customprops = {
    label: string;
    type: "text" | "email" | "number" | "password" | "button";
    id?: string;
    placeholder?: string;
    labelClassName?: string;
    inputClassName?: string;
    inputWrapperClassName?: string;
    wrapperClassName?: string;
}
type props = Customprops & Omit<React.InputHTMLAttributes<HTMLInputElement>, keyof Customprops>;

export default function Input({ label, id, type, placeholder, labelClassName, inputClassName, inputWrapperClassName, wrapperClassName, ...rest}: props) {
  return (
    <div className={wrapperClassName}>
      <label className={labelClassName} htmlFor={`${id}-input`} id={id}>
        {label}
      </label>
      <div className={inputWrapperClassName}>
        <input
          className={inputClassName}
          type={type}
          placeholder={placeholder}
          id={`${id}-input`}
          {...rest}
        />
      </div>
    </div>
  );
}