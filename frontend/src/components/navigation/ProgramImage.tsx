import type { CSSProperties, ImgHTMLAttributes } from "react";

type ProgramImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "alt"> & {
  alt: string;
  fill?: boolean;
  priority?: boolean;
};

export default function ProgramImage({
  alt,
  fill = false,
  priority = false,
  loading,
  style,
  ...props
}: ProgramImageProps) {
  const imageStyle: CSSProperties = fill
    ? { ...style, position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : style ?? {};

  return (
    <img
      {...props}
      alt={alt}
      style={imageStyle}
      loading={loading ?? (priority ? "eager" : "lazy")}
      fetchPriority={priority ? "high" : props.fetchPriority}
      decoding="async"
    />
  );
}