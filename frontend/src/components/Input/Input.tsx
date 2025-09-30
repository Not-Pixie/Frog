import type React from "react";
import "./Input.css"

type CustomProps = {
  label: string;
  type: "text" | "email" | "number" | "password" | "select";
  id?: string;
  placeholder?: string;
  labelClassName?: string;
  inputClassName?: string;
  inputWrapperClassName?: string;
  wrapperClassName?: string;
  children?: React.ReactNode; 
}

type Props = CustomProps & Omit<
  React.InputHTMLAttributes<HTMLInputElement> & React.SelectHTMLAttributes<HTMLSelectElement>,
  keyof CustomProps
>;

export default function Input({
  label,
  id,
  type,
  placeholder,
  labelClassName,
  inputClassName,
  inputWrapperClassName,
  wrapperClassName,
  children,
  ...rest
}: Props) {
  const wrapper = wrapperClassName ?? "form-field";
  const inputWrapper = inputWrapperClassName ?? "input-wrapper";
  const inputId = id ? `${id}-input` : undefined;

  if (type === "select")
    return (
        <div className={wrapper}>
      <label className={labelClassName} htmlFor={inputId} id={id}>
        {label}
      </label>
      <div className={inputWrapper}>
          <select
            id={inputId}
            className={inputClassName}
            {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            
            {placeholder ? (
              <option value="" disabled selected hidden>
                {placeholder}
              </option>
            ) : null}

            {children}
          </select>
      </div>
    </div>
    );

  return (
    <div className={wrapper}>
      <label className={labelClassName} htmlFor={inputId} id={id}>
        {label}
      </label>
      <div className={inputWrapper}>
          <input
            className={inputClassName}
            type={type}
            placeholder={placeholder}
            id={inputId}
            {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
          />
      </div>
    </div>
  );
}
