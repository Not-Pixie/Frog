
type props = {
    label: string;
    type: "text" | "email" | "number" | "password";
    id?: string;
    placeholder?: string;
    labelClassName?: string;
    inputClassName?: string;
    inputWrapperClassName?: string;
    wrapperClassName?: string;
}

export default function Input({ label, id, type, placeholder, labelClassName, inputClassName, inputWrapperClassName, wrapperClassName}: props) {
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
        />
      </div>
    </div>
  );
}