import { Avatar } from "@chakra-ui/react";
import { MotionStyle } from "framer-motion";
import Image from "next/image";
import React, { CSSProperties } from "react";

interface IUserAvatar {
  src: string;
  alt: string;
  w: number;
  h: number;
  width?: string;
  height?: string;
  name?: string;
  style?: CSSProperties;
}
function UserAvatar({
  alt,
  h,
  name,
  src,
  w,
  height,
  width,
  style,
}: IUserAvatar) {
  if (src)
    return (
      <Image
        referrerPolicy="no-referrer"
        src={src}
        alt={alt}
        width={w}
        height={h}
        style={{
          borderRadius: "50%",
          width: width || "auto",
          height: height || "2.5rem",
          ...style,
        }}
      />
    );
  else
    return (
      <Avatar
        src=""
        name={name}
        w={w || width}
        h={h || height}
        style={{
          ...style,
          borderRadius: "50%",
          width: w - 2 || width || "auto",
          height: h - 2 || height || "2.5rem",
        }}
      />
    );
}

export default UserAvatar;
